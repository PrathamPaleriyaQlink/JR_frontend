import { createContext, useContext, useEffect, useState } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("https://api.vultr3.qlink.in/api/web/alerts/all");
      const data = await res.json();
      setAlerts(data || []);
    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  const deleteAlert = async (id) => {
    try {
      await fetch(`https://api.vultr3.qlink.in/api/web/alerts/${id}`, {
        method: "DELETE",
      });
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting alert", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, deleteAlert, fetchAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
