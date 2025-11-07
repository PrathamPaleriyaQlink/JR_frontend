import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import Admin from "./pages/Admin";
import UserPage from "./pages/User";
import AdminLayout from "./layouts/adminLayout";
import AdminHome from "./pages/AdminHome";
import AdminActiveUsers from "./pages/AdminActiveUsers";
import AdminAllUsers from "./pages/AdminAllUsers";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import KBLayout from "./layouts/KBLayout";
import KnowledgeBase from "./pages/KnowledgeBase";
import SystemPrompt from "./pages/SystemPrompt";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="" element={<Main />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} /> 
            <Route path="active" element={<AdminActiveUsers />} />
            <Route path="users" element={<AdminAllUsers />} />

            <Route path="kb" element={<KBLayout />}>
              <Route index element={<SystemPrompt />} />
              <Route path="self" element={<AdminKnowledgeBase />} />
              <Route path="kb" element={<KnowledgeBase />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
