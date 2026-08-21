# FutureTek API & Database Specification Document

> **Project:** FutureTek (Agency-BrandNest)  
> **Source Backend:** Laravel 8 (`futuretek-backend-OLD`)  
> **Target Backend:** Node.js / Express or Fastify (`futuretek-backend-NEW`)  
> **Frontend:** React SPA (`futuretek-frontend`)  
> **Database:** MariaDB / MySQL Dump (`futuretechniques_admin.sql`)  
> **Specification Version:** 1.0.0  
> **Audit Date:** August 2026  

---

## 1. Authentication & Security Audit

### 1.1 `ApiKeyMiddleware` Status & Analysis
- **Registered Middleware:** In `futuretek-backend-OLD/app/Http/Kernel.php`:
  ```php
  'api.key' => \App\Http\Middleware\ApiKeyMiddleware::class,
  ```
- **Route Group Wiring:** In `futuretek-backend-OLD/routes/api.php`:
  ```php
  Route::middleware(['api.key'])->group(function () { ... });
  ```
  **ALL 27 public frontend API endpoints are wrapped inside this `api.key` middleware group.**
- **Frontend Integration:** In `futuretek-frontend/src/` (e.g. `services/index.js`, `home/component/BannerBox.js`, `stores/MetaContext.jsx`), all Axios requests send the HTTP request header:
  ```http
  apikey: Ho8nGfHHLhGurgRg1lRwKbe6URNYbrMmZyZ0AOUqm0dVUHEDjLfKsQ5Y7WFTRkt3
  ```
- **Hardcoded Secret Key in Backend:**
  - `ApiKeyMiddleware.php` validates `$request->header('apikey') === "Ho8nGfHHLhGurgRg1lRwKbe6URNYbrMmZyZ0AOUqm0dVUHEDjLfKsQ5Y7WFTRkt3"`
  - If header is missing or mismatched, returns HTTP 401:
    ```json
    {
      "error": "Unauthorized"
    }
    ```
- **Conclusion:** Unlike previous legacy projects (Sigma, TAS, Innmotek) where API key middleware was orphaned dead code, in **FutureTek this middleware IS FULLY WIRED AND ACTIVELY REQUIRED** by both backend routes and frontend requests. The new Node.js backend MUST implement an API Key validation middleware checking header `apikey` against the configured environment secret.

---

## 2. Image & File URL Resolution Format

### 2.1 Storage Directory Structure
All public uploaded assets are served from `public/frontend/images/`:
- Product Images: `/frontend/images/products/{filename}`
- Category Images: `/frontend/images/categories/{filename}`
- Blog Images: `/frontend/images/blogs/{filename}`
- Banner Images & Icons: `/frontend/images/banners/{filename}`
- Associate Logos & PDFs: `/frontend/images/associates/{filename}`
- Service Images: `/frontend/images/services/{filename}`
- Testimonial Avatars: `/frontend/images/testimonials/{filename}`
- Industry Images: `/frontend/images/industries/{filename}`
- Concern Images: `/frontend/images/concerns/{filename}`
- Feature Icons/Images: `/frontend/images/features/{filename}`
- Download Files/Images: `/frontend/images/downloads/{filename}`
- Candidate Resumes: `/frontend/images/candidates/{filename}`
- Reference Images: `/frontend/images/references/{filename}`
- Page Images: `/frontend/images/pages/{filename}`

### 2.2 Model Accessor Logic & Fallbacks
1. **Standard `getImageUrlAttribute`:**
   ```php
   if (!is_null($this->image)) {
       $directory = '/frontend/images/<entity>/';
       $imagePath = public_path() . "{$directory}" . $this->image;
       if (file_exists($imagePath)) {
           $imageUrl = asset("$directory" . $this->image);
       }
   }
   ```
2. **Fallback for Missing Images:**
   - In helper `get_image()` / `get_no_image()`: fallback URL is `<BASE_URL>/gallery/no-image.jpg` or `null` / `""` depending on endpoint helper.
3. **Multi-image JSON fields (e.g. `references.images`):**
   - Stored in MySQL as JSON string: `[{"image":"uuid.webp"},...]`
   - Formatted in API as:
     ```json
     [
       {
         "slug": "uuid.webp",
         "image": "https://api.domain.com/frontend/images/references/uuid.webp"
       }
     ]
     ```

---

## 3. Comprehensive API Routes Specification

All API responses follow a standard envelope format: `{"result": "success", ...}` or `{"result": "error", "message": ...}`.

| # | HTTP Method | Endpoint URI | Controller & Action | Auth Required | Status |
|---|-------------|--------------|---------------------|---------------|--------|
| 1 | `GET` | `/api/categories` | `CategoryController@index` | Header `apikey` | Active |
| 2 | `GET` | `/api/categories/{category}` | `CategoryController@show` | Header `apikey` | Active |
| 3 | `GET` | `/api/categories/{category}/list` | `CategoryController@category` | Header `apikey` | Active |
| 4 | `GET` | `/api/testimonials` | `TestimonialController@index` | Header `apikey` | Active |
| 5 | `GET` | `/api/banners` | `BannerController@index` | Header `apikey` | Active |
| 6 | `GET` | `/api/blogs` | `BlogController@index` | Header `apikey` | Active |
| 7 | `GET` | `/api/blogs/{blog}` | `BlogController@show` | Header `apikey` | Active |
| 8 | `GET` | `/api/blogs/categories/{blog_category}` | `BlogController@category` | Header `apikey` | Active |
| 9 | `GET` | `/api/careers` | `CareerController@index` | Header `apikey` | Active |
| 10 | `GET` | `/api/careers/{job_list}` | `CareerController@show` | Header `apikey` | Active |
| 11 | `POST` | `/api/careers/{job_list}` | `CareerController@store` | Header `apikey` | Active |
| 12 | `GET` | `/api/faqs` | `FaqController@index` | Header `apikey` | Active |
| 13 | `GET` | `/api/services` | `ServiceController@index` | Header `apikey` | Active |
| 14 | `GET` | `/api/services/{service}` | `ServiceController@show` | Header `apikey` | Active |
| 15 | `GET` | `/api/references` | `ReferenceController@index` | Header `apikey` | Active |
| 16 | `GET` | `/api/industries` | `IndustryController@index` | Header `apikey` | Active |
| 17 | `GET` | `/api/downloads` | `DownloadController@index` | Header `apikey` | Active |
| 18 | `GET` | `/api/associates` | `AssociateController@index` | Header `apikey` | Active |
| 19 | `GET` | `/api/associates/list` | `AssociateController@show` | Header `apikey` | Active |
| 20 | `GET` | `/api/sister-concern` | `ConcernController@index` | Header `apikey` | Active |
| 21 | `GET` | `/api/products/{product}` | `ProductController@show` | Header `apikey` | Active |
| 22 | `POST` | `/api/contact` | `ContactController@store` | Header `apikey` | Active |
| 23 | `GET` | `/api/pages/{page}` | `PageController@show` | Header `apikey` | Active |
| 24 | `POST` | `/api/subscriber` | `SubscriberController@store` | Header `apikey` | Active |
| 25 | `GET` | `/api/features` | `FeatureController@index` | Header `apikey` | Active |
| 26 | `GET` | `/api/plugins` | `PluginController@index` | Header `apikey` | **BROKEN** (Missing Controller) |
| 27 | `GET` | `/api/pages` | `PageController@index` | Header `apikey` | **BROKEN** (Missing Controller Method) |
| 28 | `GET` | `/api/user` | Closure (`auth:api`) | OAuth/Bearer | Unused Legacy |

---

## 4. Endpoint Details & Exact Response Payloads

### 4.1 Categories

#### 4.1.1 `GET /api/categories`
- **Purpose:** Fetches hierarchical top-level categories and nested subcategories for navigation and directory tree.
- **SQL Logic:** `SELECT * FROM categories WHERE parent_category IS NULL AND status = 1 ORDER BY order ASC` (with recursive child categories loaded via `parent_category = categories.id`).
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "categories": [
    {
      "slug": "e9323c68-45b0-4ec3-a616-e5ee246e7fbe",
      "title": "Industrial Boilers",
      "subtitle": null,
      "icon": null,
      "link": null,
      "pdf": null,
      "image": "https://api.domain.com/frontend/images/categories/a001.webp",
      "subCategory": [
        {
          "slug": "c13867c2-3e28-4c9f-8ea8-ff921d3f443b",
          "title": "Steam Boilers",
          "subtitle": null,
          "link": null,
          "pdf": null,
          "icon": null,
          "image": "https://api.domain.com/frontend/images/categories/b002.webp",
          "subCategory": []
        }
      ]
    }
  ]
}
```

#### 4.1.2 `GET /api/categories/{category}`
- **Route Param:** `category` = Category `slug` (UUID)
- **SQL Logic:**
  1. Finds target category where `slug = :category`.
  2. Resolves all recursive subcategory & child category IDs.
  3. Finds products: `SELECT * FROM products WHERE category_id IN (:allCategoryIds) AND status = 1 ORDER BY order ASC`.
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "category": {
    "title": "Industrial Boilers",
    "slug": "e9323c68-45b0-4ec3-a616-e5ee246e7fbe",
    "subtitle": null,
    "description": "<p>Category description text or HTML</p>",
    "sub_category_link": null,
    "sub_category": null,
    "link": null,
    "child_category": null,
    "child_category_link": null,
    "seo_title": "Industrial Boilers SEO Title",
    "seo_keyword": "boiler, steam, thermax",
    "seo_description": "Industrial Boilers meta description"
  },
  "products": [
    {
      "slug": "5d72b86b-ab35-49b0-8e05-884d023d49ed",
      "title": "Thermax Compac Steam Boiler",
      "summary": "Compact solid fuel steam boiler",
      "type": "Boiler",
      "image": "https://api.domain.com/frontend/images/products/p01.webp",
      "price": "0",
      "sale_price": "0"
    }
  ]
}
```

#### 4.1.3 `GET /api/categories/{category}/list`
- **Route Param:** `category` = Category `slug` (UUID)
- **SQL Logic:**
  1. Finds target category by `slug`.
  2. Finds direct child categories: `SELECT * FROM categories WHERE parent_category = :categoryId AND status = 1 ORDER BY order ASC`.
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "categories": [
    {
      "slug": "c13867c2-3e28-4c9f-8ea8-ff921d3f443b",
      "title": "Steam Boilers",
      "subtitle": null,
      "icon": null,
      "link": null,
      "pdf": null,
      "image": "https://api.domain.com/frontend/images/categories/b002.webp",
      "subCategory": []
    }
  ],
  "category": {
    "title": "Industrial Boilers",
    "slug": "e9323c68-45b0-4ec3-a616-e5ee246e7fbe",
    "subtitle": null,
    "description": "...",
    "sub_category_link": null,
    "sub_category": null,
    "link": null,
    "child_category": null,
    "child_category_link": null,
    "seo_title": "...",
    "seo_keyword": "...",
    "seo_description": "..."
  }
}
```

---

### 4.2 Testimonials

#### 4.2.1 `GET /api/testimonials`
- **SQL Logic:** `SELECT * FROM testimonials WHERE status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "testimonials": [
    {
      "name": "Bikash Shrestha",
      "company": "Chaudhary Group",
      "position": "Plant Operations Head",
      "message": "Future Techniques provided top-tier industrial solutions.",
      "image": "https://api.domain.com/frontend/images/testimonials/test01.webp"
    }
  ]
}
```

---

### 4.3 Banners

#### 4.3.1 `GET /api/banners`
- **SQL Logic:** `SELECT * FROM banners WHERE status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "banners": [
    {
      "title": "Innovative Engineering Solutions",
      "icon": "https://api.domain.com/frontend/images/banners/icon01.webp",
      "image": "https://api.domain.com/frontend/images/banners/banner01.webp"
    }
  ]
}
```

---

### 4.4 Blogs

#### 4.4.1 `GET /api/blogs`
- **Query Parameters:** `limit` (optional integer)
- **SQL Logic:** `SELECT * FROM blogs WHERE status = 1 ORDER BY id DESC` (optional `LIMIT :limit`).
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "blogs": [
    {
      "slug": "3c8479e0-0ca8-4d3a-8d56-f2dd33cb31e7",
      "title": "Advancements in Steam Energy Efficiency",
      "user": "Admin",
      "category": "Energy",
      "category_slug": "energy-systems",
      "image": "https://api.domain.com/frontend/images/blogs/blog01.webp",
      "date": "08 Apr, 2025"
    }
  ]
}
```

#### 4.4.2 `GET /api/blogs/{blog}`
- **Route Param:** `blog` = Blog `slug` (UUID)
- **SQL Logic:**
  1. Finds blog by `slug`.
  2. Finds recent 5 blogs: `SELECT * FROM blogs WHERE status = 1 ORDER BY id DESC LIMIT 5` (excluding current blog).
  3. Finds all categories: `SELECT * FROM blog_categories WHERE status = 1 ORDER BY id DESC`.
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "blog": {
    "slug": "3c8479e0-0ca8-4d3a-8d56-f2dd33cb31e7",
    "title": "Advancements in Steam Energy Efficiency",
    "summary": "Key principles for improving plant heat recovery.",
    "category": "Energy",
    "category_slug": "energy-systems",
    "description": "<p>Full blog content body here...</p>",
    "image": "https://api.domain.com/frontend/images/blogs/blog01.webp",
    "date": "08 Apr, 2025"
  },
  "blogs": [
    {
      "slug": "9a128479-0ca8-4d3a-8d56-f2dd33cb31e7",
      "title": "HVAC Chiller Technologies",
      "user": "Admin",
      "category": "HVAC",
      "category_slug": "hvac",
      "image": "https://api.domain.com/frontend/images/blogs/blog02.webp",
      "date": "02 Apr, 2025"
    }
  ],
  "categories": [
    {
      "title": "Energy",
      "slug": "energy-systems",
      "blogs": 1
    }
  ]
}
```

#### 4.4.3 `GET /api/blogs/categories/{blog_category}`
- **Route Param:** `blog_category` = Blog Category `slug` (UUID)
- **SQL Logic:** `SELECT * FROM blogs WHERE category_id = :blogCategoryId AND status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "blogs": [
    {
      "slug": "3c8479e0-0ca8-4d3a-8d56-f2dd33cb31e7",
      "title": "Advancements in Steam Energy Efficiency",
      "user": "Admin",
      "category": "Energy",
      "category_slug": "energy-systems",
      "image": "https://api.domain.com/frontend/images/blogs/blog01.webp",
      "date": "08 Apr, 2025"
    }
  ],
  "category": {
    "title": "Energy",
    "slug": "energy-systems",
    "products": 0
  }
}
```

---

### 4.5 Careers & Job Applications

#### 4.5.1 `GET /api/careers`
- **SQL Logic:** `SELECT * FROM job_lists WHERE status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "careers": [
    {
      "slug": "b0a293ec-6944-4286-98bf-4c749e7b233a",
      "title": "Senior Thermal Engineer",
      "salary": "Negotiable",
      "candidate": 2,
      "deadline": "30 Apr, 2025"
    }
  ]
}
```

#### 4.5.2 `GET /api/careers/{job_list}`
- **Route Param:** `job_list` = Job list `slug` (UUID)
- **SQL Logic:** `SELECT * FROM job_lists WHERE slug = :job_list`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "career": {
    "slug": "b0a293ec-6944-4286-98bf-4c749e7b233a",
    "title": "Senior Thermal Engineer",
    "type": "Full Time",
    "education": "Bachelor in Mechanical Engineering",
    "experience": "3+ Years in Boiler & Steam Systems",
    "salary": "Negotiable",
    "no_of_vacancy": 2,
    "candidate": 2,
    "description": "<p>Job duties and requirements...</p>",
    "deadline": "30 Apr, 2025"
  }
}
```

#### 4.5.3 `POST /api/careers/{job_list}`
- **Route Param:** `job_list` = Job list `slug` (UUID)
- **Content-Type:** `multipart/form-data`
- **Request Fields:**
  - `first_name` (string, required, max:255)
  - `last_name` (string, required, max:255)
  - `gender` (string, required)
  - `date_of_birth` (string, required)
  - `email` (string, email, required, max:255)
  - `phone_number` (string, required, max:10)
  - `permanent_address` (string, required, max:255)
  - `current_address` (string, required, max:255)
  - `education` (string, required, max:255)
  - `experience` (string, required, max:255)
  - `resume` (file, required, mimes: docx, pdf, doc)
  - `about_yourself` (string, required)
- **Success Response (HTTP 200):**
```json
{
  "result": "success",
  "message": "Successfully applied"
}
```
- **Validation Error Response (HTTP 200):**
```json
{
  "result": "error",
  "message": {
    "email": ["The email must be a valid email address."],
    "resume": ["The resume field is required."]
  }
}
```

---

### 4.6 FAQs

#### 4.6.1 `GET /api/faqs`
- **SQL Logic:**
  1. `SELECT * FROM faq_types WHERE status = 1 ORDER BY id DESC`
  2. For each FAQ Type: `SELECT * FROM faqs WHERE faq_type_id = :typeId AND status = 1`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "types": [
    {
      "title": "General Inquiries",
      "faqs": [
        {
          "question": "What industries do you serve?",
          "answer": "<p>We serve manufacturing, food processing, pharmaceuticals, and HVAC.</p>"
        }
      ]
    }
  ]
}
```

---

### 4.7 Services

#### 4.7.1 `GET /api/services`
- **SQL Logic:** `SELECT * FROM services WHERE status = 1 ORDER BY order ASC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "services": [
    {
      "title": "Boiler Installation & Commissioning",
      "slug": "83db129e-edd2-4b09-a769-5db7d6be1073",
      "summary": "End-to-end industrial boiler setup and testing.",
      "image": "https://api.domain.com/frontend/images/services/srv01.webp"
    }
  ]
}
```

#### 4.7.2 `GET /api/services/{service}`
- **Route Param:** `service` = Service `slug` (UUID)
- **SQL Logic:** `SELECT * FROM services WHERE slug = :service`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "service": {
    "slug": "83db129e-edd2-4b09-a769-5db7d6be1073",
    "title": "Boiler Installation & Commissioning",
    "description": "<p>Detailed description of service offering...</p>",
    "image": "https://api.domain.com/frontend/images/services/srv01.webp"
  }
}
```

---

### 4.8 References (Projects / Portfolio)

#### 4.8.1 `GET /api/references`
- **SQL Logic:** `SELECT * FROM `references` WHERE status = 1 ORDER BY `order` ASC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "references": [
    {
      "title": "Chaudhary Group Industrial Boiler Setup",
      "image": "https://api.domain.com/frontend/images/references/ref01.webp",
      "slug": "f03a1188-24a8-401a-9aa7-e5547baedbed"
    }
  ]
}
```

---

### 4.9 Industries

#### 4.9.1 `GET /api/industries`
- **SQL Logic:** `SELECT * FROM industries WHERE status = 1 ORDER BY `order` ASC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "industries": [
    {
      "title": "Food & Beverage",
      "image": "https://api.domain.com/frontend/images/industries/ind01.webp",
      "description": "<p>Solutions for food and beverage plants...</p>"
    }
  ]
}
```

---

### 4.10 Downloads (Brochures & Catalogues)

#### 4.10.1 `GET /api/downloads`
- **SQL Logic:** `SELECT * FROM downloads WHERE status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "downloads": [
    {
      "title": "Corporate Profile & Product Catalog 2025",
      "image": "https://api.domain.com/frontend/images/downloads/catalog2025.webp"
    }
  ]
}
```

---

### 4.11 Associates & Partners

#### 4.11.1 `GET /api/associates`
- **SQL Logic:** `SELECT * FROM associates WHERE status = 1 AND category_id = 1 ORDER BY `order` ASC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "associates": [
    {
      "title": "Thermax",
      "image": "https://api.domain.com/frontend/images/associates/3a66c036-205b-40c2-abb1-814a06661d7b.webp",
      "link": null
    }
  ]
}
```

#### 4.11.2 `GET /api/associates/list`
- **SQL Logic:**
  1. `SELECT * FROM association_categories WHERE status = 1 ORDER BY id ASC`
  2. For each category: `SELECT * FROM associates WHERE category_id = :id AND status = 1 ORDER BY `order` DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "associates": [
    {
      "title": "We are partners with",
      "description": null,
      "items": [
        {
          "title": "Alfa Laval",
          "image": "https://api.domain.com/frontend/images/associates/61e35729-3aca-4f78-bf23-0aea5ca2e32e.webp",
          "link": null
        },
        {
          "title": "Thermax",
          "image": "https://api.domain.com/frontend/images/associates/3a66c036-205b-40c2-abb1-814a06661d7b.webp",
          "link": null
        }
      ]
    },
    {
      "title": "We deals in",
      "description": null,
      "items": [
        {
          "title": "Hitachi",
          "image": "https://api.domain.com/frontend/images/associates/800671ed-7e72-421d-9482-b8a75ad97697.webp",
          "link": null
        }
      ]
    }
  ]
}
```

---

### 4.12 Sister Concern

#### 4.12.1 `GET /api/sister-concern`
- **SQL Logic:** `SELECT * FROM concerns WHERE status = 1 ORDER BY `order` ASC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "concerns": [
    {
      "title": "Techno Engineering",
      "image": "https://api.domain.com/frontend/images/concerns/concern01.webp",
      "description": "<p>Sister concern engineering division...</p>"
    }
  ]
}
```

---

### 4.13 Products

#### 4.13.1 `GET /api/products/{product}`
- **Route Param:** `product` = Product `slug` (UUID)
- **SQL Logic:** `SELECT * FROM products WHERE slug = :product`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "product": {
    "slug": "5d72b86b-ab35-49b0-8e05-884d023d49ed",
    "title": "Thermax Compac Steam Boiler",
    "description": "<p>Product technical specifications...</p>",
    "category_slug": "thermic-fluid-heater",
    "category": "Thermic Fluid Heater",
    "additionals": [
      {
        "title": "Feature 1",
        "description": "High thermal efficiency",
        "image": "",
        "imageUrl": "https://api.domain.com/frontend/images/products/feat01.webp"
      }
    ],
    "benefit_image": "https://api.domain.com/frontend/images/products/benefit.webp",
    "benefit_description": "Fuel savings up to 15%",
    "catalogue": "https://api.domain.com/frontend/images/products/catalog.pdf",
    "seo_title": "Thermax Boiler",
    "seo_keyword": "boiler, thermax",
    "seo_description": "High quality steam boilers in Nepal",
    "image": "https://api.domain.com/frontend/images/products/product01.webp"
  }
}
```

---

### 4.14 Contact Us

#### 4.14.1 `POST /api/contact`
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Request Fields:**
  - `name` (string, required, max:255)
  - `email` (string, email, required, max:255)
  - `phone_number` (string/number, required, exactly 10 digits)
  - `message` (string, required, max:1000)
- **Success Response (HTTP 200):**
```json
{
  "result": "success",
  "message": "Thank you for contacting us, we 'll be back soon."
}
```
- **Validation Error Response (HTTP 200):**
```json
{
  "result": "error",
  "message": {
    "email": ["The email must be a valid email address."],
    "phone_number": ["The phone number must be 10 digits."]
  }
}
```
- **Database Action:** Inserts into `contact_forms` (`id`, `slug` (uuid), `name`, `email`, `phone_number`, `message`, `status`=0, `created_at`, `updated_at`).

---

### 4.15 Custom Pages

#### 4.15.1 `GET /api/pages/{page}`
- **Route Param:** `page` = Page `slug` (UUID)
- **SQL Logic:** `SELECT * FROM pages WHERE slug = :page`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "page": {
    "slug": "about-us",
    "title": "About Future Techniques",
    "description": "<p>Company history and vision...</p>",
    "seo_title": "About Us | Future Techniques",
    "seo_description": "Learn more about Future Techniques",
    "seo_keyword": "future techniques, about",
    "created_at": "2024-10-02T06:30:00.000000Z",
    "updated_at": "2025-04-08T09:45:00.000000Z"
  }
}
```

---

### 4.16 Newsletter Subscribers

#### 4.16.1 `POST /api/subscriber`
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Request Fields:**
  - `email` (string, email, required, unique:subscribers, max:255)
- **Success Response (HTTP 200):**
```json
{
  "result": "success",
  "message": "You are successfully Subscribed"
}
```
- **Validation Error Response (HTTP 200):**
```json
{
  "result": "error",
  "message": {
    "email": ["The email has already been taken."]
  }
}
```
- **Database Action:** Inserts into `subscribers` (`id`, `slug` (uuid), `email`, `status`=1, `created_at`, `updated_at`).

---

### 4.17 Features

#### 4.17.1 `GET /api/features`
- **SQL Logic:** `SELECT * FROM features WHERE status = 1 ORDER BY id DESC`
- **Response Format (HTTP 200):**
```json
{
  "result": "success",
  "features": [
    {
      "title": "24/7 Support",
      "description": "Round the clock technical assistance",
      "link": null,
      "image": "https://api.domain.com/frontend/images/features/feat01.webp"
    }
  ]
}
```

---

## 5. Broken Endpoints Audit

During the audit, 2 broken endpoints were identified in `futuretek-backend-OLD/routes/api.php`:

| Broken Route | Defined Route in `api.php` | Root Cause | Database Status | Recommendation for New Backend |
|---|---|---|---|---|
| `GET /api/plugins` | `Route::get('plugins', [PluginController::class, 'index'])` | The controller file `app/Http/Controllers/Frontend/Plugin/PluginController.php` **does not exist** anywhere in the Laravel project. | `plugins` table exists in SQL dump but has **0 rows**. | Provide a stub endpoint returning `{"result":"success","plugins":[]}` or omit unless requested by frontend. |
| `GET /api/pages` | `Route::get('pages', [PageController::class, 'index'])` | `PageController.php` contains method `show(Page $page)` but **does NOT implement `index()`**. Calling this route in Laravel throws `BadMethodCallException`. | `pages` table exists in SQL dump with 1 row (`about-us`). | Provide `index` handler returning all active pages or keep standard response format. |

---

## 6. Complete Database Schema & Row Counts

The database dump `futuretechniques_admin.sql` contains **36 tables**. Every single table is explicitly audited and documented below:

### 6.1 Table: `associates`
- **Row Count:** 13
- **Columns (12):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `category_id` | int(11) DEFAULT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `order` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `link` | varchar(255) DEFAULT NULL |
| `pdf_file` | varchar(255) DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `associates_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15`

### 6.2 Table: `association_categories`
- **Row Count:** 2
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `order` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `association_categories_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3`

### 6.3 Table: `banners`
- **Row Count:** 4
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `icon` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `banners_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5`

### 6.4 Table: `blog_categories`
- **Row Count:** 2
- **Columns (12):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blog_categories_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3`

### 6.5 Table: `blogs`
- **Row Count:** 2
- **Columns (14):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `category_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `summary` | longtext DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blogs_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7`

### 6.6 Table: `brands`
- **Row Count:** 5
- **Columns (11):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `user_id` | int(11) NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `brands_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6`

### 6.7 Table: `candidates`
- **Row Count:** 1
- **Columns (16):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `name` | varchar(255) NOT NULL |
| `email` | varchar(255) NOT NULL |
| `phone_number` | varchar(255) NOT NULL |
| `current_address` | varchar(255) NOT NULL |
| `permanent_address` | varchar(255) NOT NULL |
| `date_of_birth` | varchar(255) NOT NULL |
| `gender` | varchar(255) NOT NULL |
| `post_name` | varchar(255) NOT NULL |
| `education` | varchar(255) NOT NULL |
| `experience` | varchar(255) NOT NULL |
| `resume` | varchar(255) NOT NULL |
| `remarks` | longtext DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidates_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2`

### 6.8 Table: `catalogues`
- **Row Count:** 0
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `file` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `catalogues_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`

### 6.9 Table: `categories`
- **Row Count:** 32
- **Columns (16):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `parent_category` | varchar(255) DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `navigation_status` | int(11) NOT NULL DEFAULT 0 |
| `home_status` | int(11) NOT NULL DEFAULT 0 |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `order` | int(11) DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37`

### 6.10 Table: `complain_types`
- **Row Count:** 0
- **Columns (7):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `complain_types_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`

### 6.11 Table: `complains`
- **Row Count:** 0
- **Columns (20):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `name` | varchar(255) NOT NULL |
| `email` | varchar(255) NOT NULL |
| `phone_number` | varchar(255) NOT NULL |
| `state` | varchar(255) NOT NULL |
| `city` | varchar(255) NOT NULL |
| `address` | varchar(255) NOT NULL |
| `street` | varchar(255) NOT NULL |
| `landmark` | varchar(255) DEFAULT NULL |
| `category` | varchar(255) NOT NULL |
| `product_name` | varchar(255) NOT NULL |
| `product_serial` | varchar(255) NOT NULL |
| `date_of_purchase` | varchar(255) NOT NULL |
| `complain_type` | varchar(255) NOT NULL |
| `warrenty` | varchar(255) DEFAULT NULL |
| `bill_card` | varchar(255) DEFAULT NULL |
| `remark` | text DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`

### 6.12 Table: `concerns`
- **Row Count:** 1
- **Columns (11):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `links` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `order` | int(11) NOT NULL DEFAULT 0 |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `concerns_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6`

### 6.13 Table: `contact_forms`
- **Row Count:** 6
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `name` | varchar(255) NOT NULL |
| `email` | varchar(255) NOT NULL |
| `phone_number` | varchar(255) NOT NULL |
| `subject` | varchar(255) DEFAULT NULL |
| `message` | longtext NOT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contact_forms_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7`

### 6.14 Table: `downloads`
- **Row Count:** 1
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `order` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `downloads_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2`

### 6.15 Table: `failed_jobs`
- **Row Count:** 0
- **Columns (7):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `uuid` | varchar(255) NOT NULL |
| `connection` | text NOT NULL |
| `queue` | text NOT NULL |
| `payload` | longtext NOT NULL |
| `exception` | longtext NOT NULL |
| `failed_at` | timestamp NOT NULL DEFAULT current_timestamp() |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`

### 6.16 Table: `faq_types`
- **Row Count:** 2
- **Columns (7):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `faq_types_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3`

### 6.17 Table: `faqs`
- **Row Count:** 17
- **Columns (12):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `question` | longtext NOT NULL |
| `answer` | longtext NOT NULL |
| `type_id` | int(11) DEFAULT NULL |
| `name` | varchar(255) DEFAULT NULL |
| `email` | varchar(255) DEFAULT NULL |
| `phone_number` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `faqs_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18`

### 6.18 Table: `features`
- **Row Count:** 4
- **Columns (11):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `order` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `link` | varchar(255) DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `features_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8`

### 6.19 Table: `industries`
- **Row Count:** 1
- **Columns (10):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `order` | int(11) DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `industries_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20`

### 6.20 Table: `job_lists`
- **Row Count:** 1
- **Columns (20):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `salary` | varchar(255) NOT NULL DEFAULT 'Negotiable' |
| `deadline` | varchar(255) NOT NULL |
| `education` | varchar(255) DEFAULT NULL |
| `experience` | varchar(255) DEFAULT NULL |
| `no_of_vacancy` | varchar(255) DEFAULT NULL |
| `type` | varchar(255) NOT NULL |
| `description` | longtext DEFAULT NULL |
| `summary` | longtext DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `order` | int(11) NOT NULL DEFAULT 0 |
| `seo_title` | varchar(255) DEFAULT NULL |
| `seo_keyword` | varchar(255) DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_lists_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2`

### 6.21 Table: `migrations`
- **Row Count:** 35
- **Columns (3):**
| Column | Type & Constraints |
|---|---|
| `id` | int(10) UNSIGNED NOT NULL |
| `migration` | varchar(255) NOT NULL |
| `batch` | int(11) NOT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`)`
  - `MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36`

### 6.22 Table: `model_has_permissions`
- **Row Count:** 0
- **Columns (3):**
| Column | Type & Constraints |
|---|---|
| `permission_id` | bigint(20) UNSIGNED NOT NULL |
| `model_type` | varchar(255) NOT NULL |
| `model_id` | bigint(20) UNSIGNED NOT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  ADD KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`)`
  - `ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE`

### 6.23 Table: `model_has_roles`
- **Row Count:** 3
- **Columns (3):**
| Column | Type & Constraints |
|---|---|
| `role_id` | bigint(20) UNSIGNED NOT NULL |
| `model_type` | varchar(255) NOT NULL |
| `model_id` | bigint(20) UNSIGNED NOT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  ADD KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`)`
  - `ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE`

### 6.24 Table: `pages`
- **Row Count:** 1
- **Columns (13):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `description` | longtext DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `summary` | longtext DEFAULT NULL |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pages_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17`

### 6.25 Table: `password_resets`
- **Row Count:** 0
- **Columns (3):**
| Column | Type & Constraints |
|---|---|
| `email` | varchar(255) NOT NULL |
| `token` | varchar(255) NOT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD KEY `password_resets_email_index` (`email`)`

### 6.26 Table: `permissions`
- **Row Count:** 132
- **Columns (5):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `name` | varchar(255) NOT NULL |
| `guard_name` | varchar(255) NOT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=133`

### 6.27 Table: `plugins`
- **Row Count:** 0
- **Columns (9):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `code` | longtext NOT NULL |
| `type` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plugins_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`

### 6.28 Table: `products`
- **Row Count:** 1
- **Columns (19):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `category_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `description` | longtext NOT NULL |
| `feature_and_benefit` | varchar(255) DEFAULT NULL |
| `benefit_description` | longtext DEFAULT NULL |
| `benefit_image` | varchar(255) DEFAULT NULL |
| `additionals` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additionals`)) |
| `catalogue` | varchar(255) DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `seo_title` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `seo_keywords` | longtext DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `order` | int(11) NOT NULL DEFAULT 0 |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17`

### 6.29 Table: `reference_categories`
- **Row Count:** 3
- **Columns (7):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_categories_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4`

### 6.30 Table: `references`
- **Row Count:** 1
- **Columns (14):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `category_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `images` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)) |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `references_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6`

### 6.31 Table: `role_has_permissions`
- **Row Count:** 255
- **Columns (2):**
| Column | Type & Constraints |
|---|---|
| `permission_id` | bigint(20) UNSIGNED NOT NULL |
| `role_id` | bigint(20) UNSIGNED NOT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`)`
  - `ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE`

### 6.32 Table: `roles`
- **Row Count:** 6
- **Columns (5):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `name` | varchar(255) NOT NULL |
| `guard_name` | varchar(255) NOT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7`

### 6.33 Table: `services`
- **Row Count:** 2
- **Columns (15):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `title` | varchar(255) NOT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `summary` | longtext DEFAULT NULL |
| `description` | longtext DEFAULT NULL |
| `features` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)) |
| `seo_title` | longtext DEFAULT NULL |
| `seo_keyword` | longtext DEFAULT NULL |
| `seo_description` | longtext DEFAULT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
| `order` | int(11) DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `services_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5`

### 6.34 Table: `subscribers`
- **Row Count:** 3
- **Columns (6):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `email` | varchar(255) NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subscribers_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4`

### 6.35 Table: `testimonials`
- **Row Count:** 3
- **Columns (11):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `slug` | varchar(255) NOT NULL |
| `user_id` | int(11) NOT NULL |
| `full_name` | varchar(255) NOT NULL |
| `company_name` | varchar(255) DEFAULT NULL |
| `position` | varchar(255) DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `message` | longtext NOT NULL |
| `status` | int(11) NOT NULL DEFAULT 0 |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `testimonials_slug_unique` (`slug`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4`

### 6.36 Table: `users`
- **Row Count:** 3
- **Columns (10):**
| Column | Type & Constraints |
|---|---|
| `id` | bigint(20) UNSIGNED NOT NULL |
| `name` | varchar(255) NOT NULL |
| `email` | varchar(255) NOT NULL |
| `email_verified_at` | timestamp NULL DEFAULT NULL |
| `password` | varchar(255) NOT NULL |
| `phone_number` | varchar(255) DEFAULT NULL |
| `image` | varchar(255) DEFAULT NULL |
| `remember_token` | varchar(100) DEFAULT NULL |
| `created_at` | timestamp NULL DEFAULT NULL |
| `updated_at` | timestamp NULL DEFAULT NULL |
- **Indexes / Keys:**
  - `ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`)`
  - `MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4`

---

## 7. Entity Relationships & Foreign Keys Mapping

1. **`associates`**:
   - `category_id` $\to$ `association_categories.id` (Many-to-One)
   - `user_id` $\to$ `users.id` (Many-to-One)

2. **`association_categories`**:
   - `user_id` $\to$ `users.id`

3. **`categories`**:
   - `parent_category` $\to$ `categories.id` (Self-referential hierarchy: Parent Category $\to$ Subcategory $\to$ Child Category)
   - `user_id` $\to$ `users.id`

4. **`products`**:
   - `category_id` $\to$ `categories.id` (Many-to-One)
   - `user_id` $\to$ `users.id`

5. **`blogs`**:
   - `category_id` $\to$ `blog_categories.id` (Many-to-One)
   - `user_id` $\to$ `users.id`

6. **`faqs`**:
   - `faq_type_id` $\to$ `faq_types.id` (Many-to-One)
   - `user_id` $\to$ `users.id`

7. **`references`**:
   - `category_id` $\to$ `reference_categories.id` (Many-to-One)
   - `user_id` $\to$ `users.id`

8. **RBAC (Spatie Permissions)**:
   - `model_has_roles`: `role_id` $\to$ `roles.id`, `model_id` $\to$ `users.id`
   - `role_has_permissions`: `permission_id` $\to$ `permissions.id`, `role_id` $\to$ `roles.id`
   - `model_has_permissions`: `permission_id` $\to$ `permissions.id`, `model_id` $\to$ `users.id`

9. **`candidates`**:
   - Stores applicant submissions for `job_lists` (`post_name` captures job title).

10. **`contact_forms` & `subscribers`**:
    - Standalone submission tables storing customer inquiries and newsletter subscriptions.

---

## 8. Summary & Next Steps

This specification accurately mirrors the behavior, quirks, response envelopes, validation rules, image asset structures, and database schema of `futuretek-backend-OLD`. It serves as the definitive reference document for developing the high-performance Node.js backend inside `futuretek-backend-NEW/` and future administration dashboard inside `FutureTek-admin/`.
