"use client";
import { useState, useEffect } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  model: string;
  base_url: string;
  description?: string;
}

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState("zai-glm-5-turbo");
  const [selectedModel, setSelectedModel] = useState("zai-glm-5-turbo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/grok-models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models || []);
        const def = data.defaultModel || "zai-glm-5-turbo";
        setDefaultModel(def);
        setSelectedModel(def);
      })
      .catch((err) => console.error("Failed to fetch models:", err))
      .finally(() => setLoading(false));
  }, []);

  return { models, defaultModel, selectedModel, setSelectedModel, loading };
}
