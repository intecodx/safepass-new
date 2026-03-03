"use client"

import { useSearchParams, useParams } from "next/navigation"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const params = useParams()

  const id = params.id as string
  const token = searchParams.get("token")

  if (!id || !token) {
    return <div>유효하지 않은 QR코드</div>
  }

  const verifyUrl = `https://safe-pass-inteco.vercel.app/verify/${id}?token=${token}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(verifyUrl)}`

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "white",
        margin: 0,
        padding: 0,
      }}
    >
      <img
        src={qrUrl || "/placeholder.svg"}
        alt="QR Code"
        style={{
          width: "500px",
          height: "500px",
          display: "block",
        }}
      />
    </div>
  )
}
