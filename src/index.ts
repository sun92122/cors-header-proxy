export default {
  async fetch(request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    };

    // 設定允許的來源
    const allowedOrigins = [
      "https://ntnux.org",
      "https://www.ntnux.org",
      // 動態允許 *.sun92122.com
      /\.sun92122\.com$/,
    ];

    function isOriginAllowed(origin: string | null): boolean {
      if (!origin) return false;
      if (allowedOrigins.includes(origin)) return true;
      try {
        const u = new URL(origin);
        return allowedOrigins.some((rule) =>
          typeof rule === "string"
            ? rule === origin
            : rule instanceof RegExp
            ? rule.test(u.hostname)
            : false
        );
      } catch {
        return false;
      }
    }

    async function handleOptions(request: Request): Promise<Response> {
      const origin = request.headers.get("Origin");
      if (isOriginAllowed(origin)) {
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Origin": origin,
          },
        });
      }
      return new Response("Forbidden", { status: 403 });
    }

    async function handleRequest(request: Request): Promise<Response> {
      const origin = request.headers.get("Origin");
      if (!isOriginAllowed(origin)) {
        return new Response("Forbidden", { status: 403 });
      }

      const url = new URL(request.url);
      const courseCode = url.searchParams.get("course_code");
      if (!courseCode) {
        return new Response(
          JSON.stringify({ error: "Missing course_code parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": origin,
            },
          }
        );
      }

      const apiUrl = `https://courseap2.itc.ntnu.edu.tw/acadmOpenCourse/CourseDescCtrl?action=getCoursedesc_field&course_code=${encodeURIComponent(courseCode)}`;

      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Origin: "https://courseap2.itc.ntnu.edu.tw",
        },
      });

      const body = await apiResponse.text();

      return new Response(body, {
        status: apiResponse.status,
        headers: {
          "Content-Type": apiResponse.headers.get("content-type") || "application/json",
          "Access-Control-Allow-Origin": origin,
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
