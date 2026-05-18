import { useCallback, useEffect, useRef, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { fetchMe } = useAuth();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    profileImage: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState("");
  const initial = form.name?.charAt(0).toUpperCase() || "U";
  const googleMapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  const setCoordinates = useCallback((lat, lng) => {
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/user/profile");
        const user = res.data?.user || {};
        setForm({
          name: user.name || "",
          email: user.email || "",
          profileImage: user.profileImage || "",
          address: user.location?.address || "",
          city: user.location?.city || "",
          state: user.location?.state || "",
          country: user.location?.country || "",
          pincode: user.location?.pincode || "",
          latitude: user.location?.coordinates?.latitude || "",
          longitude: user.location?.coordinates?.longitude || "",
        });
      } catch (error) {
        setError(error.response?.data?.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  useEffect(() => {
    if (!googleMapKey || !mapRef.current) return;

    const loadGoogleMaps = () => {
      if (window.google?.maps) return Promise.resolve();

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        return new Promise((resolve, reject) => {
          existingScript.addEventListener("load", resolve, { once: true });
          existingScript.addEventListener("error", reject, { once: true });
        });
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapKey}`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const center = hasCoordinates
          ? { lat: latitude, lng: longitude }
          : { lat: 20.5937, lng: 78.9629 };

        if (!googleMapRef.current) {
          googleMapRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: hasCoordinates ? 15 : 5,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          markerRef.current = new window.google.maps.Marker({
            map: googleMapRef.current,
            position: center,
            draggable: true,
          });

          googleMapRef.current.addListener("click", (event) => {
            setCoordinates(event.latLng.lat(), event.latLng.lng());
          });

          markerRef.current.addListener("dragend", (event) => {
            setCoordinates(event.latLng.lat(), event.latLng.lng());
          });

          return;
        }

        googleMapRef.current.setCenter(center);
        googleMapRef.current.setZoom(hasCoordinates ? 15 : 5);
        markerRef.current.setPosition(center);
      })
      .catch(() => setMapError("Could not load Google Maps"));

    return () => {
      cancelled = true;
    };
  }, [googleMapKey, hasCoordinates, latitude, longitude, setCoordinates]);

  const handleUseCurrentLocation = () => {
    setMapError("");

    if (!navigator.geolocation) {
      setMapError("Location is not supported in this browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setMapError("Please allow location access and try again");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const data = new FormData();
    if (!profileImageFile) {
      data.append("profileImage", form.profileImage);
    }
    data.append("address", form.address);
    data.append("city", form.city);
    data.append("state", form.state);
    data.append("country", form.country);
    data.append("pincode", form.pincode);
    data.append("latitude", form.latitude);
    data.append("longitude", form.longitude);

    if (profileImageFile) {
      data.append("profileImage", profileImageFile);
    }

    try {
      const res = await API.put("/user/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const user = res.data || {};
      setForm((current) => ({
        ...current,
        profileImage: user.profileImage || current.profileImage,
      }));
      await fetchMe();
      setMessage("Profile updated successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setError("");
    setDownloading(true);

    try {
      const res = await API.get("/user/profile/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "profile.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();

        try {
          const data = JSON.parse(text);
          setError(data.message || "Could not download PDF");
        } catch {
          setError(text || "Could not download PDF");
        }
      } else {
        setError(error.response?.data?.message || "Could not download PDF");
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="card profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <form className="profile-shell" onSubmit={handleSubmit}>
        <aside className="profile-panel">
          <div className="profile-avatar">
            {form.profileImage ? <img src={form.profileImage} alt={form.name || "Profile"} /> : <span>{initial}</span>}
          </div>
          <h1>{form.name || "Your Profile"}</h1>
          <p>{form.email}</p>

          <div className="profile-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </aside>

        <section className="card profile-form-card">
          <div className="profile-header">
            <div>
              <span className="profile-kicker">Account settings</span>
              <h2>Profile Details</h2>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <div className="profile-section">
            <h3>Basic Info</h3>
            <div className="profile-grid">
              <label>
                Name
                <input type="text" value={form.name} disabled />
              </label>
              <label>
                Email
                <input type="email" value={form.email} disabled />
              </label>
              <label className="profile-wide">
                Profile image URL
                <input
                  type="url"
                  name="profileImage"
                  placeholder="https://example.com/photo.jpg"
                  value={form.profileImage}
                  onChange={handleChange}
                />
              </label>
              <label className="profile-wide">
                Upload profile image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProfileImageFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="profile-section">
            <h3>Location</h3>
            <div className="profile-grid">
              <label className="profile-wide">
                Address
                <input
                  type="text"
                  name="address"
                  placeholder="Street address"
                  value={form.address}
                  onChange={handleChange}
                />
              </label>
              <label>
                City
                <input type="text" name="city" value={form.city} onChange={handleChange} />
              </label>
              <label>
                State
                <input type="text" name="state" value={form.state} onChange={handleChange} />
              </label>
              <label>
                Country
                <input type="text" name="country" value={form.country} onChange={handleChange} />
              </label>
              <label>
                Pincode
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} />
              </label>
              <label>
                Latitude
                <input type="number" name="latitude" value={form.latitude} onChange={handleChange} />
              </label>
              <label>
                Longitude
                <input type="number" name="longitude" value={form.longitude} onChange={handleChange} />
              </label>
              <div className="profile-wide map-tools">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                >
                  {locating ? "Finding location..." : "Use My Current Location"}
                </button>
                {mapError && <p className="error">{mapError}</p>}
              </div>
              <div className="profile-wide map-box">
                {googleMapKey ? (
                  <div ref={mapRef} className="google-map" />
                ) : (
                  <div className="map-empty">
                    Add VITE_GOOGLE_MAPS_API_KEY in .env to show Google Map
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default Profile;
