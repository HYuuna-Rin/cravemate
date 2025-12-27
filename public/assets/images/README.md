Place image files here to be served by the app.

Filename rules:
- Use kebab-case (lowercase, hyphens). Example: `chocolate-cake.jpg`
- Match the `image` path in `src/assets/data/foods.json` (e.g. `/assets/images/chocolate-cake.jpg`).
- Preferred formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`.

After adding images, restart or refresh the dev server if necessary:

```bash
cd cravemate
npm run dev
```

If an image is missing or fails to load, the app will show `placeholder.svg`.