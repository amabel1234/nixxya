import React from "react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--text-primary)" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>404</h1>
      <p style={{ marginTop: 8 }}>Halaman tidak ditemukan.</p>
      <Link href="/" style={{ display: "inline-block", marginTop: 16, color: "var(--accent-color)", textDecoration: "underline" }}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
