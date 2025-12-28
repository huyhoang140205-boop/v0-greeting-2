export const VAT_PHAM = [
  { id: "1", ten: "SƠN ĐỎ NEON", gia: 1, loai: "robot", mau: "#ff5050" },
  { id: "2", ten: "NỀN TRẠM VŨ TRỤ", gia: 3, loai: "nen", mau: "#141432" },
  { id: "3", ten: "HÀO QUANG CỰC QUANG", gia: 5, loai: "hao_quang", mau: "#9600ff" },
]

export function taoManMoi(doKho: string) {
  const limit = doKho === "KHÓ" ? 100 : 50
  const theSo = Array.from({ length: 5 }, () => Math.floor(Math.random() * limit) + 1)

  const soLuong = { DỄ: 2, VỪA: 3, KHÓ: 5 }[doKho as keyof typeof soLuongMap]
  const soLuongMap = { DỄ: 2, VỪA: 3, KHÓ: 5 }
  const chon = [...theSo].sort(() => 0.5 - Math.random()).slice(0, soLuong)

  let mucTieu = chon[0]
  for (let i = 1; i < chon.length; i++) {
    mucTieu += Math.random() > 0.5 ? chon[i] : -chon[i]
  }

  return { theSo, mucTieu }
}

export function taiGame() {
  if (typeof window === "undefined") return { diem: 0, khoDo: [] }
  return JSON.parse(localStorage.getItem("CAN_CU_TOAN") || '{"diem":0,"khoDo":[]}')
}

export function luuGame(diem: number, khoDo: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("CAN_CU_TOAN", JSON.stringify({ diem, khoDo }))
}
