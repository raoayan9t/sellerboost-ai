export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // AI GENERATOR API
    // =========================
    if (url.pathname === "/api/generate") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405 }
        );
      }

      try {
        const body = await request.json();

        const productName = String(body.productName || "").trim();
        const category = String(body.category || "").trim();
        const productDetails = String(body.productDetails || "").trim();
        const language = String(body.language || "English").trim();

        // Basic validation
        if (!productName || !productDetails) {
          return Response.json(
            {
              error: "Product name and product details are required."
            },
            { status: 400 }
          );
        }

        // Prevent extremely large requests
        if (productName.length > 200 || productDetails.length > 4000) {
          return Response.json(
            {
              error: "Product information is too long."
            },
            { status: 400 }
          );
        }

        const prompt = `
You are SellerBoost AI, a professional e-commerce copywriting assistant.

Create high-quality marketing content for an online seller.

PRODUCT NAME:
${productName}

CATEGORY:
${category || "Not specified"}

PRODUCT DETAILS:
${productDetails}

OUTPUT LANGUAGE:
${language}

Return ONLY valid JSON using exactly this structure:

{
  "title": "A compelling product title",
  "description": "A persuasive product description",
  "sellingPoints": [
    "Selling point 1",
    "Selling point 2",
    "Selling point 3",
    "Selling point 4",
    "Selling point 5"
  ],
  "caption": "A short engaging WhatsApp/social media caption"
}

Rules:

- Make the title professional and attractive.
- Do not invent specifications that are not provided.
- Make the description useful for online shoppers.
- Focus on real benefits from the supplied information.
- Create exactly 5 selling points.
- Make the social/WhatsApp caption short and engaging.
- Do not mention that you are an AI.
- Do not include markdown.
- Return JSON only.
`;

        // =========================
        // CLOUDFLARE WORKERS AI
        // =========================
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            prompt: prompt,
            max_tokens: 1000,
            temperature: 0.7
          }
        );

        let generatedText = aiResponse.response || "";

        if (!generatedText) {
          throw new Error("AI returned an empty response.");
        }

        // Remove accidental markdown code fences
        generatedText = generatedText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        // Find JSON object if model added extra text
        const firstBrace = generatedText.indexOf("{");
        const lastBrace = generatedText.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1) {
          generatedText = generatedText.slice(
            firstBrace,
            lastBrace + 1
          );
        }

        let result;

        try {
          result = JSON.parse(generatedText);
        } catch (parseError) {
          console.error("AI JSON parse error:", generatedText);

          return Response.json(
            {
              error: "AI returned an invalid response. Please try again."
            },
            { status: 502 }
          );
        }

        // Make sure required fields exist
        if (
          !result.title ||
          !result.description ||
          !Array.isArray(result.sellingPoints) ||
          !result.caption
        ) {
          return Response.json(
            {
              error: "AI response was incomplete. Please try again."
            },
            { status: 502 }
          );
        }

        return Response.json({
          success: true,
          title: result.title,
          description: result.description,
          sellingPoints: result.sellingPoints.slice(0, 5),
          caption: result.caption
        });

      } catch (error) {
        console.error("SellerBoost AI error:", error);

        return Response.json(
          {
            error: "Something went wrong. Please try again."
          },
          { status: 500 }
        );
      }
    }

    // =========================
    // HEALTH CHECK
    // =========================
    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        service: "SellerBoost AI",
        status: "online"
      });
    }

    // =========================
    // STATIC WEBSITE
    // =========================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("SellerBoost AI is online.", {
      status: 200,
      headers: {
        "content-type": "text/plain"
      }
    });
  }
};
