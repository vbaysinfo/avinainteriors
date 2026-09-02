import type {
  AdminUser,
  StudentUser,
  SuperAdminUser,
  TeacherUser,
} from "@/platform/types";

export const superAdmin: SuperAdminUser = {
  id: "super-1",
  schoolId: "platform",
  name: "Ananya Rao",
  avatarEmoji: "🛡️",
  role: "super-admin",
};

export const admins: AdminUser[] = [
  { id: "admin-sunrise", schoolId: "sunrise", name: "Krishna Murthy", avatarEmoji: "🎓", role: "admin" },
  { id: "admin-greenvalley", schoolId: "greenvalley", name: "Lakshmi Devi", avatarEmoji: "🎓", role: "admin" },
  { id: "admin-riverdale", schoolId: "riverdale", name: "Suresh Babu", avatarEmoji: "🎓", role: "admin" },
];

export const teachers: TeacherUser[] = [
  { id: "t-sunrise-1", schoolId: "sunrise", name: "Priya Sharma", avatarEmoji: "👩‍🏫", role: "teacher", subjects: ["Science"], classesHandled: [6, 7, 8] },
  { id: "t-sunrise-2", schoolId: "sunrise", name: "Ramesh Kumar", avatarEmoji: "👨‍🏫", role: "teacher", subjects: ["Maths"], classesHandled: [1, 2, 3] },
  { id: "t-sunrise-3", schoolId: "sunrise", name: "Sowmya Reddy", avatarEmoji: "👩‍🏫", role: "teacher", subjects: ["English"], classesHandled: [1, 2, 3, 4] },
  { id: "t-sunrise-4", schoolId: "sunrise", name: "Venkatesh Rao", avatarEmoji: "👨‍🏫", role: "teacher", subjects: ["Telugu"], classesHandled: [1, 2, 3, 4, 5] },
  { id: "t-sunrise-5", schoolId: "sunrise", name: "Divya Nair", avatarEmoji: "👩‍🏫", role: "teacher", subjects: ["Social Studies"], classesHandled: [5, 6, 7] },
  { id: "t-greenvalley-1", schoolId: "greenvalley", name: "Arjun Mehta", avatarEmoji: "👨‍🏫", role: "teacher", subjects: ["Science", "Maths"], classesHandled: [6, 7] },
  { id: "t-greenvalley-2", schoolId: "greenvalley", name: "Neha Kapoor", avatarEmoji: "👩‍🏫", role: "teacher", subjects: ["English"], classesHandled: [1, 2, 3] },
];

const firstNames = [
  "Aarav", "Ishita", "Rohan", "Sneha", "Kiran", "Meera", "Vikram", "Ananya",
  "Siddharth", "Pooja", "Nikhil", "Divya", "Aditya", "Kavya", "Rahul", "Tanvi",
  "Karthik", "Sanjana", "Yash", "Riya",
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const avatarEmojis = ["🦁", "🐼", "🐯", "🐨", "🦊", "🐸", "🦄", "🐵", "🐰", "🐻"];

export const students: StudentUser[] = [];

// Sunrise: Class 6 Section A gets a full, rich roster (this is our primary
// demo class — matches the seed lab content). Other classes get a lighter
// roster so admin/teacher analytics have real breadth to show.
let seq = 0;
for (const classNum of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const sectionCount = classNum === 6 ? 1 : 1;
  for (let s = 0; s < sectionCount; s++) {
    const section = ["A", "B"][s];
    const roster = classNum === 6 ? 10 : 4;
    for (let i = 0; i < roster; i++) {
      seq += 1;
      const name = `${firstNames[Math.floor(rand() * firstNames.length)]} ${["Patel", "Iyer", "Reddy", "Naidu", "Rao", "Gupta"][Math.floor(rand() * 6)]}`;
      students.push({
        id: `stu-sunrise-${seq}`,
        schoolId: "sunrise",
        name,
        avatarEmoji: avatarEmojis[Math.floor(rand() * avatarEmojis.length)],
        role: "student",
        classNum,
        section,
        xp: Math.floor(rand() * 900),
        streakDays: Math.floor(rand() * 12),
        lastActiveISO: new Date(Date.now() - Math.floor(rand() * 10) * 86400000).toISOString(),
        badges: rand() > 0.5 ? ["first-lab"] : [],
        completedLabIds: [],
      });
    }
  }
}

for (const classNum of [6, 7]) {
  for (let i = 0; i < 6; i++) {
    seq += 1;
    const name = `${firstNames[Math.floor(rand() * firstNames.length)]} ${["Shah", "Verma", "Menon", "Rana", "Choudhary"][Math.floor(rand() * 5)]}`;
    students.push({
      id: `stu-greenvalley-${seq}`,
      schoolId: "greenvalley",
      name,
      avatarEmoji: avatarEmojis[Math.floor(rand() * avatarEmojis.length)],
      role: "student",
      classNum,
      section: "A",
      xp: Math.floor(rand() * 700),
      streakDays: Math.floor(rand() * 8),
      lastActiveISO: new Date(Date.now() - Math.floor(rand() * 14) * 86400000).toISOString(),
      badges: [],
      completedLabIds: [],
    });
  }
}

// A handful of hand-picked, memorable demo logins so the login screens have
// obvious "click me" options instead of forcing users to guess a name.
export const featuredStudent = students.find((s) => s.schoolId === "sunrise" && s.classNum === 6)!;
featuredStudent.name = "Aarav Patel";
featuredStudent.xp = 780;
featuredStudent.streakDays = 6;
featuredStudent.badges = ["first-lab", "streak-3", "science-star"];
featuredStudent.completedLabIds = ["sci-acid-base", "ss-water-cycle", "eng-phonics-match"];

export const getUsersBySchool = (schoolId: string) => ({
  students: students.filter((s) => s.schoolId === schoolId),
  teachers: teachers.filter((t) => t.schoolId === schoolId),
  admin: admins.find((a) => a.schoolId === schoolId),
});
