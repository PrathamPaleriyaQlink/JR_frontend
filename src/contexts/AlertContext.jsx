import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_WEB_BASE } from "@/lib/api";

const AlertContext = createContext();

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const beep = (startTime, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const t = ctx.currentTime;
    beep(t, 880, 0.18);
    beep(t + 0.25, 1100, 0.18);
    beep(t + 0.5, 880, 0.18);
  } catch {
    // Audio API blocked or unavailable; fail silently.
  }
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const seenAlertIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_WEB_BASE}/alerts/all`);
      const data = await res.json();
      const newAlerts = (data || []).sort(
        (a, b) => (b.created_at || 0) - (a.created_at || 0)
      );
      const newIds = new Set(newAlerts.map((alert) => alert._id));
      const hasNewAlert = newAlerts.some(
        (alert) => !seenAlertIdsRef.current.has(alert._id)
      );

      // Play sound only after first load and only when a new alert appears.
      if (initializedRef.current && hasNewAlert) {
        playAlertSound();
      }

      seenAlertIdsRef.current = newIds;
      initializedRef.current = true;
      setAlerts(newAlerts);
    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  const deleteAlert = async (id) => {
    try {
      await fetch(`${API_WEB_BASE}/alerts/${id}`, {
        method: "DELETE",
      });
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      seenAlertIdsRef.current.delete(id);
    } catch (err) {
      console.error("Error deleting alert", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, deleteAlert, fetchAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
