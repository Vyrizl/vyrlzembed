import { GetServerSideProps } from "next";
import Head from "next/head";
import { getDb } from "../../lib/db";
import { getFileCategory } from "../../lib/fileTypes";

interface Props {
  slug: string;
  originalName: string;
  mimeType: string;
  fileType: string;
  fileSize: number;
  baseUrl: string;
  notFound?: boolean;
}

export default function EmbedPage({
  slug,
  originalName,
  mimeType,
  fileType,
  fileSize,
  baseUrl,
  notFound,
}: Props) {
  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", fontFamily: "sans-serif", color: "#aaa" }}>
        <h1>404</h1>
        <p>File not found or has been deleted.</p>
      </div>
    );
  }

  const rawUrl = `${baseUrl}/api/raw/${slug}`;

  const isImage = fileType === "image";
  const isVideo = fileType === "video";

  const title = originalName;
  const description = isVideo
    ? "▶ Click to play video"
    : isImage
    ? "🖼 View image"
    : `📁 ${originalName}`;

  return (
    <>
      <Head>
        {/* Discord Open Graph tags */}
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* OG core */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${baseUrl}/e/${slug}`} />
        <meta property="og:site_name" content="EmbedLink" />

        {isImage && (
          <>
            <meta property="og:type" content="website" />
            <meta property="og:image" content={rawUrl} />
            <meta property="og:image:type" content={mimeType} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={rawUrl} />
          </>
        )}

        {isVideo && (
          <>
            <meta property="og:type" content="video.other" />
            <meta property="og:video" content={rawUrl} />
            <meta property="og:video:type" content={mimeType} />
            <meta property="og:video:width" content="1280" />
            <meta property="og:video:height" content="720" />
            {/* Discord video embed fallback thumbnail */}
            <meta property="og:image" content={`${baseUrl}/api/thumb/${slug}`} />
          </>
        )}

        {!isImage && !isVideo && (
          <>
            <meta property="og:type" content="website" />
          </>
        )}
      </Head>

      {/* Visible page for non-Discord viewers */}
      <main
        style={{
          minHeight: "100vh",
          background: "#0d0d0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 640,
            width: "100%",
            padding: "2rem",
            background: "#18181b",
            borderRadius: "16px",
            border: "1px solid #27272a",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {isImage ? "🖼" : isVideo ? "🎬" : "📁"}
          </div>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            {originalName}
          </h1>
          <p style={{ color: "#71717a", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
            {(fileSize / 1024 / 1024).toFixed(2)} MB · {mimeType}
          </p>

          {isImage && (
            <img
              src={rawUrl}
              alt={originalName}
              style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "1rem" }}
            />
          )}

          {isVideo && (
            <video
              controls
              src={rawUrl}
              style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "1rem" }}
            />
          )}

          <a
            href={rawUrl}
            download={originalName}
            style={{
              display: "inline-block",
              padding: "0.6rem 1.5rem",
              background: "#5865f2",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Download
          </a>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { slug } = ctx.params as { slug: string };

  const db = getDb();
  const rows = await db`
    SELECT original_name, mime_type, file_size, file_type, embed_slug
    FROM files WHERE embed_slug = ${slug}
  `;

  if (rows.length === 0) {
    return { props: { notFound: true, slug, originalName: "", mimeType: "", fileType: "", fileSize: 0, baseUrl: "" } };
  }

  const f = rows[0];
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${ctx.req.headers.host}`;

  return {
    props: {
      slug,
      originalName: f.original_name,
      mimeType: f.mime_type,
      fileType: f.file_type,
      fileSize: Number(f.file_size),
      baseUrl,
    },
  };
};
