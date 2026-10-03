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
const prompt = `
You are SellerBoost AI, a professional e-commerce copywriter.

Your job is to create CUSTOMER-FACING product marketing content.

The generated content will be displayed directly to shoppers.
NEVER write instructions about how to create the content.
NEVER explain your role.
NEVER say "this content is for an online seller".
NEVER mention AI.
NEVER mention this prompt.

PRODUCT INFORMATION:

Product Name:
${productName}

Category:
${category || "Not specified"}

Product Details:
${productDetails}

Requested Language:
${language}


========================
WRITING RULES
========================

1. Write naturally like a professional e-commerce brand.

2. The content must be written directly for the CUSTOMER.

3. Use ONLY facts provided in the product information.

4. Do NOT invent:
- specifications
- dimensions
- materials
- certifications
- warranties
- prices
- discounts
- delivery claims
- medical benefits
- performance guarantees
- features that were not provided

5. You may describe a provided feature in terms of its obvious practical benefit.

6. Avoid generic filler such as:
- "This content is..."
- "As an online seller..."
- "This product is perfect for..."
unless the sentence naturally describes the actual product.

7. Do not repeat the product information word-for-word.

8. Make the copy concise, clear and persuasive.

9. Use proper grammar and natural wording.

10. Do not use markdown headings, quotation marks around the entire response, or explanations outside the requested fields.


========================
PRODUCT TITLE
========================

Create ONE professional product title.

Requirements:
- Clear
- Attractive
- Search-friendly
- Include the most important product feature or benefit when appropriate
- Do not use fake claims
- Do not use excessive emojis
- Keep it reasonably concise


========================
DESCRIPTION
========================

Write a customer-facing product description.

Requirements:
- 2 short paragraphs
- Explain what the product is
- Highlight the most useful provided features
- Explain practical benefits
- Make it suitable for Shopify, Daraz, Instagram or a general online store
- Do not talk about the seller or this AI
- Do not use bullet points in the description


========================
KEY SELLING POINTS
========================

Create EXACTLY 5 short selling points.

Each point must:
- Be based on an actual provided feature
- Communicate a customer benefit where possible
- Be concise
- Avoid fake claims
- Not repeat the same idea


========================
WHATSAPP / SOCIAL CAPTION
========================

Create ONE short promotional caption.

Requirements:
- Start with an attractive natural hook
- Mention the main product benefit
- Include 2-3 relevant features
- End with a simple call-to-action such as "Message us to order!"
- Use a few relevant emojis, but don't overuse them
- Keep it suitable for WhatsApp, Instagram and Facebook


========================
LANGUAGE
========================

Write ALL four outputs in:
${language}

If the requested language is Roman Urdu, use natural Roman Urdu commonly used by Pakistani online shoppers.

If the requested language is Urdu, use natural Urdu script.

Return ONLY the requested JSON object.
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
