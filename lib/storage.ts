// 전역 데이터 저장소 (실제 환경에서는 데이터베이스 사용)
export interface User {
  id: number
  name: string
  phone: string
  nationality: string
  passport_number: string | null
  birth_date: string
  gender: string
  construction_plan_id: number | null
  roles: {
    site_manager: boolean
    vehicle_owner: boolean
  }
  vehicle_info: {
    number: string
    type: string
  } | null
  status: string
  qr_code_url: string | null
  created_at: string
}

// 전역 사용자 저장소
const globalUsers: User[] = [
  {
    id: 1,
    name: "김근로자",
    phone: "010-1234-5678",
    nationality: "KR",
    passport_number: null,
    birth_date: "1990-01-01",
    gender: "male",
    construction_plan_id: 1,
    roles: {
      site_manager: true,
      vehicle_owner: false,
    },
    vehicle_info: null,
    status: "pending",
    qr_code_url: null,
    created_at: "2024-02-01T09:00:00Z",
  },
  {
    id: 2,
    name: "John Smith",
    phone: "010-9876-5432",
    nationality: "US",
    passport_number: "P123456789",
    birth_date: "1985-05-15",
    gender: "male",
    construction_plan_id: 2,
    roles: {
      site_manager: false,
      vehicle_owner: true,
    },
    vehicle_info: {
      number: "12가3456",
      type: "승용차",
    },
    status: "approved",
    qr_code_url: null,
    created_at: "2024-02-02T10:30:00Z",
  },
]

let nextId = 3

export const getUsers = (): User[] => {
  console.log("getUsers 호출됨, 현재 사용자 수:", globalUsers.length)
  console.log("현재 저장된 사용자들:", globalUsers)
  return [...globalUsers] // 복사본 반환
}

export const addUser = (userData: Omit<User, "id" | "created_at" | "status" | "qr_code_url">): User => {
  const newUser: User = {
    ...userData,
    id: nextId++,
    status: "pending",
    qr_code_url: null,
    created_at: new Date().toISOString(),
  }

  globalUsers.push(newUser)
  console.log("새 사용자 추가됨:", newUser)
  console.log("업데이트된 전체 사용자 목록 (총 " + globalUsers.length + "명):", globalUsers)

  return newUser
}

export const updateUserStatus = (id: number, status: string): User | null => {
  const userIndex = globalUsers.findIndex((user) => user.id === id)
  if (userIndex !== -1) {
    globalUsers[userIndex].status = status
    if (status === "approved") {
      globalUsers[userIndex].qr_code_url = `https://example.com/qr/${id}`
    }
    console.log(`사용자 ${id} 상태 업데이트: ${status}`)
    return globalUsers[userIndex]
  }
  console.log(`사용자 ${id}를 찾을 수 없음`)
  return null
}

export const findUserByPhone = (phone: string): User | undefined => {
  const user = globalUsers.find((user) => user.phone === phone)
  console.log(`전화번호 ${phone}로 사용자 검색 결과:`, user ? `찾음 (ID: ${user.id})` : "없음")
  return user
}
