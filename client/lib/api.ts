
import apiClient from "./apiClient";

export async function apiGet<T>(path: string): Promise<T> {
  const { data } = await apiClient.get<T>(path);
  return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.post<T>(path, body);
  return data;
}
