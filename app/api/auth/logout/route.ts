export async function POST() {
  const response = Response.json({ message: "Logged out" });
  response.headers.append(
    "Set-Cookie",
    "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  return response;
}
