from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import numpy as np
from sklearn.ensemble import IsolationForest
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stockage en mémoire
alertes = []
historique_connexions = {}

# Modèle IA
modele = IsolationForest(contamination=0.1, random_state=42)
modele_entraine = False

class Alerte(BaseModel):
    ip: str
    type_attaque: str
    nb_connexions: int
    nb_ports: int
    timestamp: str = None

def extraire_features(alerte):
    return [alerte.nb_connexions, alerte.nb_ports]

def analyser_anomalie(alerte):
    global modele_entraine

    if alerte.ip not in historique_connexions:
        historique_connexions[alerte.ip] = []

    historique_connexions[alerte.ip].append(
        extraire_features(alerte)
    )

    # On entraîne le modèle dès qu'on a assez de données
    tous_les_points = []
    for points in historique_connexions.values():
        tous_les_points.extend(points)

    if len(tous_les_points) >= 10:
        modele.fit(tous_les_points)
        modele_entraine = True

    # Si le modèle est entraîné, on prédit
    if modele_entraine:
        prediction = modele.predict([extraire_features(alerte)])
        return prediction[0] == -1  # -1 = anomalie
    
    return True  # Par défaut on considère tout suspect

@app.post("/alerte")
def recevoir_alerte(alerte: Alerte):
    if not alerte.timestamp:
        alerte.timestamp = datetime.now().strftime("%H:%M:%S")

    est_anomalie = analyser_anomalie(alerte)

    alerte_data = {
        "ip": alerte.ip,
        "type": alerte.type_attaque,
        "nb_connexions": alerte.nb_connexions,
        "nb_ports": alerte.nb_ports,
        "timestamp": alerte.timestamp,
        "anomalie": est_anomalie
    }

    alertes.append(alerte_data)
    print(f"[{alerte.timestamp}] {alerte.type_attaque} depuis {alerte.ip} — anomalie IA : {est_anomalie}")

    return {"status": "ok", "anomalie": est_anomalie}

@app.get("/alertes")
def get_alertes():
    return alertes

@app.get("/stats")
def get_stats():
    total = len(alertes)
    anomalies = len([a for a in alertes if a["anomalie"]])
    types = {}
    ips = {}

    for a in alertes:
        types[a["type"]] = types.get(a["type"], 0) + 1
        ips[a["ip"]] = ips.get(a["ip"], 0) + 1

    return {
        "total": total,
        "anomalies": anomalies,
        "types": types,
        "ips_suspectes": ips
    }

@app.get("/")
def root():
    return {"status": "Dashboard sécurité IA opérationnel"}