import React, { ReactNode, useState } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { FieldError, FieldErrorsImpl } from 'react-hook-form';

interface FloatingLabelInputProps extends TextInputProps {
	label: string;
	secureTextEntry?: boolean;
	value: string;
	onChangeText: (text: string) => void;
	multiline?: boolean;
	numberOfLines?: number;
	editable?: boolean;
	errorMessage?: string | FieldError | FieldErrorsImpl;
	rightIcon?: ReactNode;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
	label,
	secureTextEntry,
	value,
	onChangeText,
	multiline,
	numberOfLines,
	editable = true,
	errorMessage,
	...props
}) => {
	const [isFocused, setIsFocused] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.inputContainer,
				{ borderColor: isFocused ? colors.primary : '#ccc' },
			]}
		>
			<Text
				style={[
					styles.label,
					{
						top: isFocused || value ? 0 : 18,
						color: isFocused ? colors.primary : '#aaa',
					},
				]}
			>
				{label}
			</Text>
			<View style={styles.inputWrapper}>
				<TextInput
					{...props}
					value={value}
					onChangeText={onChangeText}
					secureTextEntry={secureTextEntry && !isPasswordVisible}
					multiline={multiline}
					numberOfLines={numberOfLines}
					style={[
						styles.input,
						{
							color: colors.secondary,
							height: multiline ? 100 : 'auto',
						},
					]}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					editable={editable}
				/>
				{props.rightIcon && (
					<TouchableOpacity style={styles.icon}>
						{props.rightIcon}
					</TouchableOpacity>
				)}
				{secureTextEntry && (
					<TouchableOpacity
						style={styles.icon}
						onPress={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						<Icon
							name={isPasswordVisible ? 'eye-off' : 'eye'}
							size={24}
							color={colors.primary}
						/>
					</TouchableOpacity>
				)}
			</View>
			{errorMessage && (
				<Text style={styles.errorText}>{errorMessage.toString()}</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: {
		width: '100%',
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 20,
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 10,
		position: 'relative',
	},
	label: {
		position: 'absolute',
		left: 10,
		fontSize: 12,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	input: {
		flex: 1,
		fontSize: 15,
		paddingVertical: 4,
	},
	icon: {
		padding: 5,
	},
	errorText: {
		color: 'red',
		fontSize: 12,
	},
});

export default FloatingLabelInput;
