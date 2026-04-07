import React, { useRef } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    View,
    Platform,
} from "react-native";
import { Colors } from "../../constants/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    isLoading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    fullWidth?: boolean;
}

export default function Button({
    label,
    onPress,
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled = false,
    icon,
    iconPosition = "left",
    fullWidth = false,
}: ButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
    };

    const variantStyles = {
        primary: {
            bg: Colors.gold,
            text: Colors.carbon950,
            border: "transparent",
        },
        secondary: {
            bg: Colors.carbon700,
            text: Colors.dark.text,
            border: "transparent",
        },
        ghost: {
            bg: "transparent",
            text: Colors.gold,
            border: "transparent",
        },
        danger: {
            bg: Colors.error,
            text: "#FFFFFF",
            border: "transparent",
        },
        outline: {
            bg: "transparent",
            text: Colors.gold,
            border: Colors.gold,
        },
    };

    const sizeStyles = {
        sm: { paddingH: 14, paddingV: 8, fontSize: 13, radius: 7 },
        md: { paddingH: 20, paddingV: 12, fontSize: 15, radius: 9 },
        lg: { paddingH: 28, paddingV: 16, fontSize: 16, radius: 12 },
    };

    const vs = variantStyles[variant];
    const ss = sizeStyles[size];

    return (
        <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: "100%" }]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isLoading}
                activeOpacity={1}
                style={[
                    styles.base,
                    {
                        backgroundColor: vs.bg,
                        paddingHorizontal: ss.paddingH,
                        paddingVertical: ss.paddingV,
                        borderRadius: ss.radius,
                        borderWidth: variant === "outline" ? 1.5 : 0,
                        borderColor: vs.border,
                        opacity: disabled ? 0.45 : 1,
                        width: fullWidth ? "100%" : undefined,
                    },
                ]}
            >
                {isLoading ? (
                    <ActivityIndicator
                        color={vs.text}
                        size="small"
                    />
                ) : (
                    <View style={styles.inner}>
                        {icon && iconPosition === "left" && (
                            <View style={styles.iconLeft}>{icon}</View>
                        )}
                        <Text
                            style={[
                                styles.label,
                                { color: vs.text, fontSize: ss.fontSize },
                            ]}
                        >
                            {label}
                        </Text>
                        {icon && iconPosition === "right" && (
                            <View style={styles.iconRight}>{icon}</View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontWeight: "700",
        letterSpacing: 0.3,
        fontFamily: Platform.select({ web: "DM Sans", default: "sans-serif" }),
    },
    iconLeft: { marginRight: 8 },
    iconRight: { marginLeft: 8 },
});