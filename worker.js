export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // HEALTH CHECK
    // =========================================================

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        service: "SellerBoost AI",
        status: "online"
      });
    }

    // =========================================================
    // AI PRODUCT GENERATOR
    // =========================================================

    if (url.pathname === "/api/generate") {

      // Only POST is allowed
      if (request.method !== "POST") {
        return Response.json(
          {
            success: false,
            error: "Method not allowed."
          },
          {
            status: 405
          }
        );
      }

      try {

        // -------------------------------------------------------
        // READ REQUEST
        // -------------------------------------------------------

        const body = await request.json();

        const productName = String(
          body?.productName || ""
        ).trim();

        const category = String(
          body?.category || ""
        ).trim();

        const productDetails = String(
          body?.productDetails || ""
        ).trim();

        const language = String(
          body?.language || "English"
        ).trim();


        // -------------------------------------------------------
        // VALIDATION
        // -------------------------------------------------------

        if (!productName) {
          return Response.json(
            {
              success: false,
              error: "Please enter a product name."
            },
            {
              status: 400
            }
          );
        }

        if (!productDetails) {
          return Response.json(
            {
              success: false,
              error: "Please enter product details."
            },
            {
              status: 400
            }
          );
        }

        if (productName.length > 200) {
          return Response.json(
            {
              success: false,
              error: "Product name is too long."
            },
            {
              status: 400
            }
          );
        }

        if (productDetails.length > 5000) {
          return Response.json(
            {
              success: false,
              error: "Product details are too long."
            },
            {
              status: 400
            }
          );
        }


        // =======================================================
        // PREMIUM SELLERBOOST AI PROMPT
        // =======================================================

        const systemPrompt = `
You are SellerBoost AI.

You are an expert e-commerce copywriter who creates high-quality
product listings for online stores, Shopify, Daraz, Instagram,
Facebook and WhatsApp sellers.

Your writing must sound like it was written by a professional
e-commerce brand.

IMPORTANT:

The customer will see your generated content directly.

Therefore:

- NEVER explain what you are doing.
- NEVER explain the prompt.
- NEVER mention that you are an AI.
- NEVER say "this content is for an online seller".
- NEVER say "here is your generated content".
- NEVER discuss your instructions.
- NEVER include analysis.
- NEVER include notes.
- NEVER include markdown headings.
- ONLY return the requested JSON object.


ACCURACY RULES:

Use ONLY the product information supplied by the user.

Never invent:

- prices
- discounts
- warranties
- guarantees
- certifications
- dimensions
- weight
- battery capacity
- delivery times
- stock availability
- medical claims
- performance claims
- specifications
- features that were not provided

You may explain the practical benefit of a feature when that
benefit is obvious and reasonable.

Example:

Feature:
"USB charging"

Good:
"Convenient USB charging makes it easy to recharge."

Bad:
"Charges in only 30 minutes."

The second statement invents a specification.


WRITING STYLE:

- Natural
- Modern
- Clear
- Professional
- Persuasive
- Concise
- Customer-focused
- Easy to understand
- No unnecessary filler
- No exaggerated claims
- No keyword stuffing


LANGUAGE RULES:

The requested language is:

${language}

If language is English:
Use natural professional English.

If language is Roman Urdu:
Use natural Pakistani Roman Urdu.
Do NOT use Urdu script.

If language is Urdu:
Use natural Urdu script.

Keep the meaning and product facts accurate in every language.
`;


        const userPrompt = `
Create a complete product marketing package using the following
product information.

PRODUCT NAME:
${productName}

CATEGORY:
${category || "Not specified"}

PRODUCT DETAILS:
${productDetails}


OUTPUT REQUIREMENTS:


1. PRODUCT TITLE

Create one strong e-commerce product title.

The title should:

- Clearly identify the product
- Include an important feature or benefit when appropriate
- Sound professional
- Be easy to understand
- Be suitable for Shopify, Daraz and social commerce
- Avoid fake claims
- Avoid excessive emojis

Do not make the title unnecessarily long.


2. PRODUCT DESCRIPTION

Write a customer-facing product description.

Requirements:

- 2 short paragraphs
- Explain what the product is
- Highlight the most useful provided features
- Explain practical benefits naturally
- Make the customer understand why the product is useful
- Sound like a professional store
- Do not mention the seller
- Do not mention AI
- Do not use bullet points
- Do not repeat the product details word-for-word


3. KEY SELLING POINTS

Create EXACTLY 5 selling points.

Each selling point must:

- Be short
- Be useful
- Be based on an actual product feature
- Communicate a genuine benefit where possible
- Avoid repetition
- Avoid fake claims


4. WHATSAPP / SOCIAL CAPTION

Create one short promotional caption.

Requirements:

- Start with a natural attention-grabbing hook
- Mention the main product benefit
- Mention 2-3 important product features
- Use a few relevant emojis
- Keep it suitable for WhatsApp, Instagram and Facebook
- End with a simple call-to-action

Examples of suitable calls-to-action:

"Message us to order!"
"DM us to order!"
"Order yours today!"

Only use a CTA that does not make an unsupported claim.


Return ONLY the requested JSON object.
`;


        // =======================================================
        // RUN CLOUDFLARE WORKERS AI
        // =======================================================

        if (!env.AI) {
          return Response.json(
            {
              success: false,
              error: "Workers AI binding is not configured."
            },
            {
              status: 500
            }
          );
        }


        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            prompt:
              systemPrompt +
              "\n\n" +
              userPrompt,

            temperature: 0.55,

            max_tokens: 1400,

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


        // =======================================================
        // EXTRACT AI RESPONSE
        // =======================================================

        let result = aiResponse?.response;


        // Sometimes response can already be an object.
        if (
          result &&
          typeof result === "object"
        ) {
          result = result;
        }

        // If response is a string, parse it.
        else if (
          typeof result === "string"
        ) {

          let cleaned = result.trim();

          // Remove possible markdown code fences
          cleaned = cleaned
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          try {

            result = JSON.parse(cleaned);

          } catch (parseError) {

            // ---------------------------------------------------
            // FALLBACK: FIND JSON OBJECT INSIDE RESPONSE
            // ---------------------------------------------------

            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");

            if (
              firstBrace !== -1 &&
              lastBrace !== -1 &&
              lastBrace > firstBrace
            ) {

              const possibleJson =
                cleaned.slice(
                  firstBrace,
                  lastBrace + 1
                );

              try {

                result = JSON.parse(
                  possibleJson
                );

              } catch (fallbackError) {

                console.error(
                  "SellerBoost AI JSON parse failed:",
                  cleaned
                );

                return Response.json(
                  {
                    success: false,
                    error:
                      "AI returned an invalid response. Please try again."
                  },
                  {
                    status: 502
                  }
                );
              }

            } else {

              console.error(
                "No JSON object found:",
                cleaned
              );

              return Response.json(
                {
                  success: false,
                  error:
                    "AI returned an invalid response. Please try again."
                },
                {
                  status: 502
                }
              );
            }
          }
        }


        // =======================================================
        // VALIDATE AI RESULT
        // =======================================================

        if (
          !result ||
          typeof result !== "object"
        ) {

          console.error(
            "Invalid AI result:",
            result
          );

          return Response.json(
            {
              success: false,
              error:
                "AI returned an invalid response. Please try again."
            },
            {
              status: 502
            }
          );
        }


        const title =
          typeof result.title === "string"
            ? result.title.trim()
            : "";

        const description =
          typeof result.description === "string"
            ? result.description.trim()
            : "";

        const caption =
          typeof result.caption === "string"
            ? result.caption.trim()
            : "";

        const sellingPoints =
          Array.isArray(result.sellingPoints)
            ? result.sellingPoints
                .filter(
                  point =>
                    typeof point === "string" &&
                    point.trim().length > 0
                )
                .map(
                  point => point.trim()
                )
                .slice(0, 5)
            : [];


        // =======================================================
        // FINAL VALIDATION
        // =======================================================

        if (
          !title ||
          !description ||
          !caption ||
          sellingPoints.length !== 5
        ) {

          console.error(
            "Incomplete AI result:",
            result
          );

          return Response.json(
            {
              success: false,
              error:
                "AI returned an incomplete response. Please try again."
            },
            {
              status: 502
            }
          );
        }


        // =======================================================
        // SUCCESS RESPONSE
        // =======================================================

        // =======================================================

        return Response.json({
          success: true,
          title,
          description,
          sellingPoints,
          caption
        });

      } catch (error) {

        console.error(
          "SellerBoost AI Error:",
          error
        );

        return Response.json(
          {
            success: false,
            error:
              "AI generation failed. Please try again."
          },
          {
            status: 500
          }
        );
      }
    }


    // =========================================================
    // STATIC WEBSITE
    // =========================================================

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }


    // =========================================================
    // FALLBACK
    // =========================================================

    return new Response(
      "SellerBoost AI is online.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }
};
