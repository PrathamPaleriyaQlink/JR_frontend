import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_WEB_BASE } from "@/lib/api";

const AlertContext = createContext();

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  } catch {
    // Audio API blocked or unavailable — fail silently
  }
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_WEB_BASE}/alerts/all`);
      const data = await res.json();
      const newAlerts = data || [];

      // Play sound only after first load and only when count increases
      if (initializedRef.current && newAlerts.length > prevCountRef.current) {
        playAlertSound();
      }

      prevCountRef.current = newAlerts.length;
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
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch (err) {
      console.error("Error deleting alert", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, deleteAlert, fetchAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
