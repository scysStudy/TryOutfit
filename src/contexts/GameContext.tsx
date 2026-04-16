"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import type { GameState, GameAction, HistoryItem, UserCredits, ApiError } from "@/types";
import { generateTryOnImage, isApiError, shouldDeductCredit } from "@/services/tryon.service";

const initialCredits: UserCredits = {
  remaining: 3,
  total: 3,
  isSubscribed: false,
};

const initialState: GameState = {
  personImage: null,
  clothingImage: null,
  currentResult: null,
  history: [],
  credits: initialCredits,
  isGenerating: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PERSON_IMAGE":
      return { ...state, personImage: action.payload, error: null };
    case "SET_CLOTHING_IMAGE":
      return { ...state, clothingImage: action.payload, error: null };
    case "SET_RESULT":
      return { ...state, currentResult: action.payload, isGenerating: false };
    case "ADD_TO_HISTORY":
      return { ...state, history: [action.payload, ...state.history] };
    case "REMOVE_FROM_HISTORY":
      return {
        ...state,
        history: state.history.filter((item) => item.id !== action.payload),
      };
    case "CLEAR_CURRENT":
      return { ...state, clothingImage: null, currentResult: null, error: null };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isGenerating: false };
    case "UPDATE_CREDITS":
      return {
        ...state,
        credits: { ...state.credits, ...action.payload },
      };
    case "CLEAR_ALL":
      return { ...initialState, credits: state.credits };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setPersonImage: (image: GameState["personImage"]) => void;
  setClothingImage: (image: GameState["clothingImage"]) => void;
  setResult: (result: GameState["currentResult"]) => void;
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearCurrent: () => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  updateCredits: (credits: Partial<UserCredits>) => void;
  useCredit: () => boolean;
  resetSession: () => void;
  generateTryOn: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setPersonImage = useCallback(
    (image: GameState["personImage"]) => {
      if (image) dispatch({ type: "SET_PERSON_IMAGE", payload: image });
    },
    []
  );

  const setClothingImage = useCallback(
    (image: GameState["clothingImage"]) => {
      if (image) dispatch({ type: "SET_CLOTHING_IMAGE", payload: image });
    },
    []
  );

  const setResult = useCallback(
    (result: GameState["currentResult"]) => {
      if (result) dispatch({ type: "SET_RESULT", payload: result });
    },
    []
  );

  const addToHistory = useCallback((item: HistoryItem) => {
    dispatch({ type: "ADD_TO_HISTORY", payload: item });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FROM_HISTORY", payload: id });
  }, []);

  const clearCurrent = useCallback(() => {
    dispatch({ type: "CLEAR_CURRENT" });
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    dispatch({ type: "SET_GENERATING", payload: generating });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const updateCredits = useCallback((credits: Partial<UserCredits>) => {
    dispatch({ type: "UPDATE_CREDITS", payload: credits });
  }, []);

  const useCredit = useCallback(() => {
    if (state.credits.remaining > 0) {
      updateCredits({ remaining: state.credits.remaining - 1 });
      return true;
    }
    return false;
  }, [state.credits.remaining, updateCredits]);

  const resetSession = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const generateTryOn = useCallback(async () => {
    if (!state.personImage || !state.clothingImage || !state.clothingImage.category) {
      setError("Please upload both person and clothing images");
      return;
    }

    if (!useCredit()) {
      setError("No credits remaining. Please subscribe for more tries.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log("[GameContext] 开始调用试衣API", {
        personImageId: state.personImage.id,
        clothingImageId: state.clothingImage.id,
        category: state.clothingImage.category,
      });

      const result = await generateTryOnImage({
        personImageUrl: state.personImage.url,
        clothingImageUrl: state.clothingImage.url,
        category: state.clothingImage.category,
      });

      const tryOnResult = {
        id: `result-${Date.now()}`,
        personImageId: state.personImage.id,
        clothingImageId: state.clothingImage.id,
        resultUrl: result.url,
        timestamp: Date.now(),
      };

      setResult(tryOnResult);

      const historyItem: HistoryItem = {
        id: `history-${Date.now()}`,
        personImage: state.personImage,
        clothingImage: state.clothingImage,
        result: tryOnResult,
      };

      addToHistory(historyItem);

      console.log("[GameContext] 试衣结果生成成功", {
        resultId: tryOnResult.id,
        resultUrl: result.url,
      });
    } catch (error) {
      console.error("[GameContext] 试衣API调用失败", {
        error: isApiError(error) ? error : String(error),
      });

      if (isApiError(error)) {
        setError(error.message);

        if (!shouldDeductCredit(error)) {
          updateCredits({ remaining: state.credits.remaining });
        }
      } else {
        setError("Failed to generate try-on result. Please try again.");

        updateCredits({ remaining: state.credits.remaining });
      }
    }
  }, [
    state.personImage,
    state.clothingImage,
    state.credits.remaining,
    useCredit,
    setGenerating,
    setError,
    setResult,
    addToHistory,
    updateCredits,
  ]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        setPersonImage,
        setClothingImage,
        setResult,
        addToHistory,
        removeFromHistory,
        clearCurrent,
        setGenerating,
        setError,
        updateCredits,
        useCredit,
        resetSession,
        generateTryOn,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
