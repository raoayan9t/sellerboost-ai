export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // HEALTH CHECK
    // ==========================================

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        service: "SellerBoost AI",
        status: "online"
      });
    }

    // ==========================================
    // AI GENERATOR
    // ==========================================

    if (url.pathname === "/api/generate") {

      if (request.method !== "POST") {
        return Response.json(
          {
            error: "Method not allowed"
          },
          {
            status: 405
          }
        );
      }

      try {

        const body = await request.json();

        const productName = String(
          body.productName || ""
        ).trim();

        const category = String(
          body.category || ""
        ).trim();

        const productDetails = String(
          body.productDetails || ""
        ).trim();

        const language = String(
          body.language || "English"
        ).trim();


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!productName) {
          return Response.json(
            {
              error: "Product name is required."
            },
            {
              status: 400
            }
          );
        }

        if (!productDetails) {
          return Response.json(
            {
              error: "Product details are required."
            },
            {
              status: 400
            }
          );
        }

        if (productName.length > 200) {
          return Response.json(
            {
              error: "Product name is too long."
            },
            {
              status: 400
            }
          );
        }

        if (productDetails.length > 4000) {
          return Response.json(
            {
              error: "Product details are too long."
            },
            {
              status: 400
            }
          );
        }


        // ==========================================
        // AI PROMPT
        // ==========================================

        const prompt = `
You are SellerBoost AI, an expert e-commerce copywriter.

Create professional product marketing content for an online seller.

PRODUCT NAME:
${productName}

CATEGORY:
${category || "Not specified"}

PRODUCT DETAILS:
${productDetails}

LANGUAGE:
${language}

IMPORTANT RULES:

1. Write all generated content in the requested language.
2. Create an attractive but accurate product title.
3. Create a professional and persuasive product description.
4. Create exactly 5 key selling points.
5. Create a short WhatsApp/social media caption.
6. Only use information provided by the seller.
7. Never invent specifications, measurements, certifications, guarantees, prices or features.
8. Focus on genuine benefits of the product.
9. Do not mention AI.
10. Do not use markdown.
`;


        // ==========================================
        // STRUCTURED AI RESPONSE
        // ==========================================

        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            prompt: prompt,

            temperature: 0.6,

            max_tokens: 1200,

            response_format: {
              type: "json_schema",

              json_schema: {
                type: "object",

                properties: {

                  title: {
                    type: "string"
                  },

                  description: {
                    type: "string"
                  },

                  sellingPoints: {
                    type: "array",

                    items: {
                      type: "string"
                    },

                    minItems: 5,

                    maxItems: 5
                  },

                  caption: {
                    type: "string"
                  }

                },

                required: [
                  "title",
                  "description",
                  "sellingPoints",
                  "caption"
                ],

                additionalProperties: false
              }
            }
          }
        );


        // ==========================================
        // GET AI RESPONSE
        // ==========================================

        let result = aiResponse?.response;


        // Some Workers AI responses may already be
        // an object when JSON mode is used.
        if (typeof result === "string") {

          try {
            result = JSON.parse(result);
          } catch (error) {

            console.error(
              "JSON parse failed:",
              result
            );

            return Response.json(
              {
                error:
                  "AI returned an invalid structured response. Please try again."
              },
              {
                status: 502
              }
            );
          }
        }


        // ==========================================
        // VALIDATE RESULT
        // ==========================================

        if (
          !result ||
          typeof result.title !== "string" ||
          typeof result.description !== "string" ||
          !Array.isArray(result.sellingPoints) ||
          typeof result.caption !== "string"
        ) {

          console.error(
            "Invalid AI result:",
            result
          );

          return Response.json(
            {
              error:
                "AI returned an incomplete response. Please try again."
            },
            {
              status: 502
            }
          );
        }


        // ==========================================
        // RETURN RESULT
        // ==========================================

        return Response.json({
          success: true,

          title: result.title.trim(),

          description:
            result.description.trim(),

          sellingPoints:
            result.sellingPoints
              .slice(0, 5)
              .map(point => String(point).trim()),

          caption:
            result.caption.trim()
        });

      } catch (error) {

        console.error(
          "SellerBoost AI error:",
          error
        );

        return Response.json(
          {
            error:
              "AI generation failed. Please try again."
          },
          {
            status: 500
          }
        );
      }
    }


    // ==========================================
    // STATIC WEBSITE
    // ==========================================

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "SellerBoost AI is online.",
      {
        status: 200,
        headers: {
          "content-type": "text/plain"
        }
      }
    );
  }
};
