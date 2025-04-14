/// <reference types="vitest" />
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UserManagement from "../components/admin/UserManagement";
import * as adminApi from "../services/adminApi";

vi.mock("../services/adminApi");

const mockUsers = [
  {
    user_id: "u1",
    email: "user1@example.com",
    full_name: "User One",
    roles: [{ role_id: "r1", name: "Admin" }],
  },
];

const mockRoles = [
  { role_id: "r1", name: "Admin" },
  { role_id: "r2", name: "Editor" },
];

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminApi.fetchUsers as any).mockResolvedValue(mockUsers);
    (adminApi.fetchRoles as any).mockResolvedValue(mockRoles);
  });

  it("renders users and roles after loading", async () => {
    render(<UserManagement />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    expect(await screen.findByText("user1@example.com")).toBeInTheDocument();
    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Select role")).toBeInTheDocument();
  });

  it("assigns a role to a user", async () => {
    (adminApi.assignRoleToUser as any).mockResolvedValue({});
    render(<UserManagement />);
    await waitFor(() => screen.getByText("user1@example.com"));

    fireEvent.change(screen.getByTestId("assign-role-select"), {
      target: { value: "r2" },
    });

    await waitFor(() =>
      expect(adminApi.assignRoleToUser).toHaveBeenCalledWith("u1", "r2")
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Role assigned successfully/i)
      ).toBeInTheDocument()
    );
  });

  it("removes a role from a user", async () => {
    (adminApi.removeRoleFromUser as any).mockResolvedValue({});
    render(<UserManagement />);
    await waitFor(() => screen.getByText("user1@example.com"));

    fireEvent.click(screen.getByTitle("Remove Role"));

    await waitFor(() =>
      expect(adminApi.removeRoleFromUser).toHaveBeenCalledWith("u1", "r1")
    );
    await waitFor(() =>
      expect(screen.getByText(/Role removed successfully/i)).toBeInTheDocument()
    );
  });

  it("shows error message on API failure", async () => {
    (adminApi.fetchUsers as any).mockRejectedValueOnce(
      new Error("Fetch failed")
    );
    (adminApi.fetchRoles as any).mockResolvedValue(mockRoles);

    render(<UserManagement />);
    await waitFor(() =>
      expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument()
    );
  });
});
