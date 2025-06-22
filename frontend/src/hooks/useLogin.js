import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { login } from "../lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Handle successful login, e.g., redirect or show a message
      console.log("Login successful:", data);
      queryClient.invalidateQueries(["authUser"]);
    },
    onError: (error) => {
      // Handle error, e.g., show an error message
      console.error("Login failed:", error);
    },
  });

  return {
    isPending,
    error,
    loginMutation: mutate,
  };
};

export default useLogin;
