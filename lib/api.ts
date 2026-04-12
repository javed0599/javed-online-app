import axios from "axios";
import { LaborResult, ApiParams } from "./types";

const API_BASE_URL = "https://svp-international-api.pacc.sa/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function fetchLaborResult(
  params: ApiParams
): Promise<LaborResult | null> {
  try {
    const queryParams = {
      passport_number: params.passport_number,
      occupation_key: params.occupation_key,
      nationality_id: params.nationality_id || "BGD",
      locale: params.locale || "en",
    };

    const response = await apiClient.get<LaborResult>(
      "/visitor_space/labors",
      { params: queryParams }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching labor result:", error);
    throw error;
  }
}

export function formatExamDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function getResultStatusColor(status: "passed" | "failed" | "pending"): string {
  if (status === "passed") return "#22c55e";
  if (status === "failed") return "#ef4444";
  return "#f59e0b"; // warning/orange for pending
}

export function getResultStatusLabel(status: "passed" | "failed" | "pending"): string {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  return "Pending";
}
