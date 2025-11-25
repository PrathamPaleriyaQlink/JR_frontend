import { createContext, useContext, useState } from "react";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [employeeData, setEmployeeData] = useState({});

  return (
    <AdminContext.Provider value={{ employeeData, setEmployeeData }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);