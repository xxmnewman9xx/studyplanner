import React from "react";
import { View, Text } from "react-native";
import { Sparkles } from "lucide-react-native";
import { LiquidGlassBadge, LiquidGlassCTA, LiquidGlassRail, LiquidGlassSurface } from "../src/components/LiquidGlass";

export default { title: "StudyPlanner/LiquidGlassPrimitives" };

export function Primitives() {
  return (
    <View style={{ padding: 18, gap: 12 }}>
      <LiquidGlassSurface tone="hero">
        <LiquidGlassBadge label="Apple School OS" tone="accent" />
        <Text style={{ color: "white", fontSize: 24, fontWeight: "900", marginTop: 12 }}>Reusable native Liquid Glass surface</Text>
        <LiquidGlassRail value={0.72} />
      </LiquidGlassSurface>
      <LiquidGlassCTA label="Open Widget Studio" icon={Sparkles} onPress={() => {}} />
    </View>
  );
}
