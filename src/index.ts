export default {
  async fetch(request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    };

    async function handleOptions(request: Request): Promise<Response> {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    async function handleRequest(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const courseCode = url.searchParams.get("course_code");

      if (!courseCode) {
        return new Response(
          JSON.stringify({ error: "Missing course_code parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // 建立目標 URL
      const apiUrl = `https://courseap2.itc.ntnu.edu.tw/acadmOpenCourse/CourseDescCtrl?action=getCoursedesc_field&course_code=${encodeURIComponent(courseCode)}`;

      // 發送請求
      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Origin": "https://courseap2.itc.ntnu.edu.tw", // 偽造 Origin 減少被拒的可能性
        },
      });

      // 將回應包裝並加上 CORS header
      const body = await apiResponse.text();

      return new Response(body, {
        status: apiResponse.status,
        headers: {
          "Content-Type": apiResponse.headers.get("content-type") || "application/json",
          ...corsHeaders,
        },
      });
    }

    if (request.method === "OPTIONS") {
      return handleOptions(request);
    } else if (request.method === "GET") {
      return handleRequest(request);
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  },
} satisfies ExportedHandler;
