import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from "axios";

const API = "http://127.0.0.1:8000";
const COLORS = ["#0f6e56", "#e24b4a", "#ba7517", "#378add"];

function StatCard({ label, value, couleur }) {
  return (
    <div style={{
      background: couleur || "#f1efe8",
      borderRadius: 12,
      padding: "1rem 1.5rem",
      textAlign: "center",
      flex: 1
    }}>
      <div style={{ fontSize: 32, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#5f5e5a", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function App() {
  const [alertes, setAlertes] = useState([]);
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      const [a, s] = await Promise.all([
        axios.get(`${API}/alertes`),
        axios.get(`${API}/stats`)
      ]);
      setAlertes(a.data.slice(-20).reverse());
      setStats(s.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const dataTypes = stats ? Object.entries(stats.types).map(([k, v]) => ({ name: k, value: v })) : [];
  const dataIps = stats ? Object.entries(stats.ips_suspectes).map(([k, v]) => ({ ip: k, alertes: v })) : [];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ color: "#0f6e56", borderBottom: "2px solid #0f6e56", paddingBottom: 10 }}>
        Dashboard Sécurité IA
      </h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        Mise à jour toutes les 3 secondes
      </p>

      {stats && (
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <StatCard label="Total alertes" value={stats.total} />
          <StatCard label="Anomalies IA" value={stats.anomalies} couleur="#fcebeb" />
          <StatCard label="IPs suspectes" value={Object.keys(stats.ips_suspectes).length} couleur="#faeeda" />
          <StatCard label="Types détectés" value={Object.keys(stats.types).length} couleur="#eaf3de" />
        </div>
      )}

      <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
        {dataTypes.length > 0 && (
          <div style={{ flex: 1, background: "#fff", border: "0.5px solid #ddd", borderRadius: 12, padding: "1rem" }}>
            <h3 style={{ margin: "0 0 16px", color: "#333", fontWeight: 500 }}>Types d'attaques</h3>
            <PieChart width={280} height={200}>
              <Pie data={dataTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                {dataTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        )}

        {dataIps.length > 0 && (
          <div style={{ flex: 2, background: "#fff", border: "0.5px solid #ddd", borderRadius: 12, padding: "1rem" }}>
            <h3 style={{ margin: "0 0 16px", color: "#333", fontWeight: 500 }}>IPs les plus suspectes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataIps}>
                <XAxis dataKey="ip" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alertes" fill="#0f6e56" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #ddd", borderRadius: 12, padding: "1rem" }}>
        <h3 style={{ margin: "0 0 16px", color: "#333", fontWeight: 500 }}>Dernières alertes</h3>
        {alertes.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14 }}>Aucune alerte pour le moment...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0f6e56", color: "white" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Heure</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>IP</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Type</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Connexions</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Anomalie IA</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={{ padding: "8px 12px" }}>{a.timestamp}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{a.ip}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      background: a.type === "BRUTE_FORCE" ? "#fcebeb" : "#faeeda",
                      color: a.type === "BRUTE_FORCE" ? "#791f1f" : "#633806",
                      padding: "2px 10px", borderRadius: 20, fontSize: 12
                    }}>{a.type}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>{a.nb_connexions}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      background: a.anomalie ? "#fcebeb" : "#eaf3de",
                      color: a.anomalie ? "#791f1f" : "#27500a",
                      padding: "2px 10px", borderRadius: 20, fontSize: 12
                    }}>{a.anomalie ? "Anomalie" : "Normal"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;