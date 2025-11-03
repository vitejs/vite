// DUNDGOVI ZEV CLUB - React + Tailwind сайт
// Хэрхэн ашиглах вэ:
// 1️⃣ Tailwind болон react-router-dom суулгасан байх
// 2️⃣ Энэхүү файлыг src/App.jsx болгож хуулна
// 3️⃣ npm run dev командыг ажиллуулна

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// --- Навигаци ---
function Navbar() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
              ЗЭВ
            </div>
            <div>
              <h1 className="text-xl font-semibold text-blue-700">
                Дундговь аймгийн Зэв клуб
              </h1>
              <p className="text-sm text-gray-500">
                Таеквондо — бэлтгэл, ур чадвар, нэгдэл
              </p>
            </div>
          </div>
          <nav className="hidden md:flex gap-4 items-center">
            <NavLink to="/">Нүүр</NavLink>
            <NavLink to="/about">Бидний тухай</NavLink>
            <NavLink to="/players">Тамирчид</NavLink>
            <NavLink to="/schedule">Хуваарь</NavLink>
            <NavLink to="/attendance">Ирц</NavLink>
            <NavLink to="/contact">Холбоо</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md font-medium"
    >
      {children}
    </Link>
  );
}

// --- Нүүр хуудас ---
function Home() {
  return (
    <main>
      <section className="bg-gradient-to-r from-blue-50 to-white text-center py-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">
          Дундговь аймгийн Зэв клуб
        </h2>
        <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
          Таеквондог сонирхогчид болон тэмцээнд бэлдэхэд зориулсан сургалт.
          Насанд хүрэгчид, хүүхдүүдэд тохирсон хөтөлбөр.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/contact"
            className="px-5 py-3 bg-blue-600 text-white rounded-md font-medium"
          >
            Бүртгүүлэх
          </Link>
          <Link
            to="/schedule"
            className="px-5 py-3 border border-blue-600 text-blue-600 rounded-md font-medium"
          >
            Хичээлийн хуваарь
          </Link>
        </div>
      </section>
    </main>
  );
}

// --- Бидний тухай ---
function About() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-blue-800">Бидний тухай</h2>
      <p className="mt-4 text-gray-700">
        Дундговь аймгийн Зэв клуб нь залууст спортын мэдлэг, өөртөө итгэх
        итгэлийг нэмэгдүүлэх зорилготой. Хичээлийг нас, чадварт нийцүүлэн
        явуулдаг ба аюулгүй, эерэг орчин бүрдүүлнэ.
      </p>
      <ul className="mt-4 space-y-2 text-gray-600">
        <li>• Бэлтгэл: долоо хоногт 3 удаа</li>
        <li>• Сургагч багш: улсын зэрэгтэй</li>
        <li>• Байршил: Дундговь аймаг (зохих хаягийг нэмнэ үү)</li>
      </ul>
    </section>
  );
}

// --- Тамирчид ---
function Players() {
  const players = [
    { id: 1, name: "Н. Бат-Очир", age: 14, belt: "Шаварт" },
    { id: 2, name: "Б. Энхтуяа", age: 17, belt: "Шар" },
    { id: 3, name: "Д. Сэргэлэн", age: 20, belt: "Цагаан" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-blue-800">Тамирчид</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {players.map((p) => (
          <div key={p.id} className="bg-white shadow rounded p-4">
            <div className="h-36 bg-blue-50 rounded flex items-center justify-center text-blue-400">
              Зураг
            </div>
            <h3 className="mt-3 font-semibold text-gray-800">{p.name}</h3>
            <p className="text-sm text-gray-600">
              Нас: {p.age} • Хамар: {p.belt}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Хичээлийн хуваарь ---
function Schedule() {
  const schedule = [
    { day: "Даваа", time: "18:00 - 19:30", level: "Хүүхдүүд" },
    { day: "Мягмар", time: "18:00 - 20:00", level: "Залуучууд" },
    { day: "Пүрэв", time: "18:00 - 19:30", level: "Анхан шат" },
    { day: "Бямба", time: "10:00 - 12:00", level: "Томчууд" },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-blue-800">Хичээлийн хуваарь</h2>
      <div className="mt-6 bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-blue-700">
                Өдөр
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-blue-700">
                Цаг
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-blue-700">
                Түвшин
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {schedule.map((s, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-gray-700">{s.day}</td>
                <td className="px-4 py-3 text-gray-700">{s.time}</td>
                <td className="px-4 py-3 text-gray-700">{s.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- Ирц ---
function Attendance() {
  const [records] = React.useState([
    { date: "2025-10-27", present: 12, total: 15 },
    { date: "2025-10-29", present: 14, total: 16 },
    { date: "2025-11-02", present: 10, total: 13 },
  ]);

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-blue-800">Ирц</h2>
      <div className="mt-6 bg-white rounded shadow p-4">
        <ul className="space-y-3">
          {records.map((r, i) => (
            <li key={i} className="flex justify-between">
              <span className="text-gray-700">{r.date}</span>
              <span className="font-medium text-blue-700">
                {r.present}/{r.total} ирсэн
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// --- Холбоо барих ---
function Contact() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-blue-800">Холбоо барих</h2>
      <div className="mt-6 bg-white rounded shadow p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Мэдээлэл илгээгдлээ!");
          }}
        >
          <div>
            <label className="block text-sm text-gray-600">Нэр</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded"
              placeholder="Таны нэр"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Утас</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded"
              placeholder="Утасны дугаар"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Мессеж</label>
            <textarea
              className="w-full mt-1 px-3 py-2 border rounded"
              placeholder="Хүсэлт, асуулт"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Илгээх
          </button>
        </form>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="bg-blue-50 mt-8 py-6 text-center text-gray-600 text-sm">
      © {new Date().getFullYear()} Дундговь аймгийн Зэв клуб
    </footer>
  );
}

// --- App ---
export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/players" element={<Players />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </Router>
  );
}
