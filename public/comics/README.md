# Comic image folders

Create one lowercase folder per comic slug. The accepted convention is:

```text
public/comics/tigerman/cover.jpg
public/comics/tigerman/1.jpg
public/comics/tigerman/2.jpg
```

Set the extension in `src/data/comics.json`. Other names are never requested. Missing images automatically show the comic title's first letter.

The page list is automatic. Add or remove numerically named files while the dev
server is running and the app will reload with the new page count. Supported page
formats are PNG, JPG/JPEG, WebP, and AVIF. The `preview` array in the JSON only
marks which of those pages should appear as previews.
