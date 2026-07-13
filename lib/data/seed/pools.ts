export const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
  "Ishaan", "Rohan", "Kabir", "Aryan", "Dhruv", "Karan", "Yash", "Aniket",
  "Rudra", "Shaurya", "Advik", "Neel", "Om", "Parth", "Raghav", "Samar",
]
export const FIRST_NAMES_FEMALE = [
  "Aanya", "Diya", "Saanvi", "Ananya", "Ira", "Myra", "Aadhya", "Kiara",
  "Riya", "Anika", "Navya", "Pari", "Sara", "Tara", "Zoya", "Meera",
  "Ishita", "Kavya", "Aisha", "Nisha", "Priya", "Ritika", "Simran", "Vanya",
]
export const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Iyer", "Nair", "Reddy", "Rao", "Menon",
  "Kapoor", "Malhotra", "Chatterjee", "Bose", "Mukherjee", "Pillai", "Joshi",
  "Desai", "Shah", "Patel", "Singh", "Kumar", "Agarwal", "Bhatt", "Trivedi",
  "Nayak", "Pandey", "Mehta", "Chawla", "Bhatia", "Sethi", "Khanna",
]

export const CLASS_NAMES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
]
export const SECTIONS = ["A", "B", "C"]

export const SUBJECT_POOL: { name: string; code: string; type: "core" | "elective" | "extra_curricular" }[] = [
  { name: "English", code: "ENG", type: "core" },
  { name: "Mathematics", code: "MATH", type: "core" },
  { name: "Science", code: "SCI", type: "core" },
  { name: "Social Studies", code: "SST", type: "core" },
  { name: "Hindi", code: "HIN", type: "core" },
  { name: "Computer Science", code: "CS", type: "elective" },
  { name: "Physical Education", code: "PE", type: "extra_curricular" },
  { name: "Art & Craft", code: "ART", type: "extra_curricular" },
  { name: "Music", code: "MUS", type: "extra_curricular" },
  { name: "Environmental Studies", code: "EVS", type: "core" },
]

export const DESIGNATIONS = [
  "Teacher", "Senior Teacher", "Head of Department", "PGT", "TGT", "PRT",
]
export const DEPARTMENTS = [
  "Science", "Mathematics", "Languages", "Social Science", "Computer Science", "Arts & Sports",
]

export const CITIES = [
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Kochi", state: "Kerala" },
]

export const STREET_NAMES = [
  "MG Road", "Church Street", "Brigade Road", "Residency Road", "Lake View Road",
  "Park Street", "Anna Salai", "Jubilee Hills Road", "Koramangala 4th Block", "Indiranagar 100ft Road",
]

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export const HOUSES = ["Amber", "Emerald", "Sapphire", "Ruby"]

export function fullName(rng: { item: <T>(arr: readonly T[]) => T; bool: (p?: number) => boolean }) {
  const isMale = rng.bool()
  const first = rng.item(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE)
  const last = rng.item(LAST_NAMES)
  return { first, last, gender: isMale ? ("male" as const) : ("female" as const) }
}

export function randomPhone(rng: { int: (min: number, max: number) => number }) {
  return `+91 ${rng.int(70000, 99999)}${rng.int(10000, 99999)}`
}

export function randomAddress(rng: {
  item: <T>(arr: readonly T[]) => T
  int: (min: number, max: number) => number
}) {
  const { city, state } = rng.item(CITIES)
  const street = rng.item(STREET_NAMES)
  return {
    line1: `${rng.int(1, 200)}, ${street}`,
    city,
    state,
    pincode: String(rng.int(500000, 699999)),
  }
}
