import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import RoleManagement from "@/components/admin/RoleManagement";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const UserRoleManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  // Set the active tab based on the URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "roles") {
      setActiveTab("roles");
    }
  }, [location]);

  return (
    <ProtectedLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User & Role Management</h1>
          <Link
            to="/admin"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </div>

        <Tabs
          defaultValue="users"
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // Update the URL when tab changes
            navigate(
              `/admin/users-roles${value === "roles" ? "?tab=roles" : ""}`,
              { replace: true }
            );
          }}
          className="w-full"
        >
          <TabsList className="bg-gray-800 w-full justify-start mb-6">
            <TabsTrigger
              value="users"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Role & Permission Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0 space-y-4">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="roles" className="mt-0 space-y-4">
            <RoleManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
};

// Wrapper component for UserManagement to remove duplicate header
const UserManagementTab: React.FC = () => {
  return <UserManagement hideHeader={true} />;
};

// Wrapper component for RoleManagement to remove duplicate header
const RoleManagementTab: React.FC = () => {
  return <RoleManagement hideHeader={true} />;
};

export default UserRoleManagement;
