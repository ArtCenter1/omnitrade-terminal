/// <reference types="vitest" />
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RoleManagement from "../components/admin/RoleManagement";
import * as adminApi from "../services/adminApi";

vi.mock("../services/adminApi");

const mockRoles = [
  {
    role_id: "r1",
    name: "Admin",
    description: "Administrator role",
    permissions: [
      {
        permission_id: "p1",
        action: "create",
        resource: "user",
        description: "Create user",
      },
    ],
  },
];

const mockPermissions = [
  {
    permission_id: "p1",
    action: "create",
    resource: "user",
    description: "Create user",
  },
  {
    permission_id: "p2",
    action: "delete",
    resource: "user",
    description: "Delete user",
  },
];

describe("RoleManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminApi.fetchRoles as any).mockResolvedValue(mockRoles);
    (adminApi.fetchPermissions as any).mockResolvedValue(mockPermissions);
  });

  it("renders roles and permissions after loading", async () => {
    render(<RoleManagement />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(
      screen.getAllByText((content, element) =>
        element.textContent.includes("Administrator role")
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Create user/i)).toBeInTheDocument();
    expect(screen.getByText(/Delete user/i)).toBeInTheDocument();
  });

  it("creates a new role", async () => {
    (adminApi.createRole as any).mockResolvedValue({});
    render(<RoleManagement />);
    await waitFor(() => screen.getByText("Admin"));

    fireEvent.change(screen.getByTestId("role-name-input"), {
      target: { value: "Editor" },
    });
    fireEvent.change(screen.getByTestId("role-description-input"), {
      target: { value: "Editor role" },
    });
    fireEvent.click(screen.getByTestId("add-role-button"));

    await waitFor(() =>
      expect(adminApi.createRole).toHaveBeenCalledWith({
        name: "Editor",
        description: "Editor role",
      })
    );
    await waitFor(() =>
      expect(screen.getByText(/Role created successfully/i)).toBeInTheDocument()
    );
  });

  it("deletes a role", async () => {
    (adminApi.deleteRole as any).mockResolvedValue({});
    render(<RoleManagement />);
    await waitFor(() => screen.getByText("Admin"));

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => expect(adminApi.deleteRole).toHaveBeenCalledWith("r1"));
    await waitFor(() =>
      expect(screen.getByText(/Role deleted successfully/i)).toBeInTheDocument()
    );
  });

  it("creates a new permission", async () => {
    (adminApi.createPermission as any).mockResolvedValue({});
    render(<RoleManagement />);
    await waitFor(() => screen.getByText("Admin"));

    fireEvent.change(screen.getByPlaceholderText(/Action/i), {
      target: { value: "update" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Resource/i), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Description")[1], {
      target: { value: "Update user" },
    });
    fireEvent.click(screen.getByText("Add Permission"));

    await waitFor(() =>
      expect(adminApi.createPermission).toHaveBeenCalledWith({
        action: "update",
        resource: "user",
        description: "Update user",
      })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Permission created successfully/i)
      ).toBeInTheDocument()
    );
  });

  it("deletes a permission", async () => {
    (adminApi.deletePermission as any).mockResolvedValue({});
    render(<RoleManagement />);
    await waitFor(() => screen.getByText("Admin"));

    fireEvent.click(screen.getAllByText("Delete")[1]);

    await waitFor(() =>
      expect(adminApi.deletePermission).toHaveBeenCalledWith("p1")
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Permission deleted successfully/i)
      ).toBeInTheDocument()
    );
  });

  it("shows error message on API failure", async () => {
    (adminApi.fetchRoles as any).mockRejectedValueOnce(
      new Error("Fetch failed")
    );
    (adminApi.fetchPermissions as any).mockResolvedValue(mockPermissions);

    render(<RoleManagement />);
    await waitFor(() =>
      expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument()
    );
  });
});
