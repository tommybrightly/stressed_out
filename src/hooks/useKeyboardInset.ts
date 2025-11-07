import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  const heightRef = useRef(0);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      heightRef.current = h;
      setInset(h);
    };
    const onHide = () => {
      heightRef.current = 0;
      setInset(0);
    };

    const sub1 = Keyboard.addListener(showEvt, onShow);
    const sub2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return inset;
}
