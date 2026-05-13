export async function POST() {
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    },
  });
  return response;
}
