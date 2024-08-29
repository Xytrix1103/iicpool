import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { FieldError, FieldErrorsImpl } from 'react-hook-form'

interface FloatingLabelInputProps extends TextInputProps {
	label: string;
	secureTextEntry?: boolean;
	value?: string;
	onChangeText: (text: string) => void;
	multiline?: boolean;
	numberOfLines?: number;
	editable?: boolean;
	errorMessage?: string | FieldError | FieldErrorsImpl;
	rightIcon?: ReactNode;
	limit?: number;
	isAutofill?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = (
	{
		label,
		secureTextEntry,
		value,
		onChangeText,
		multiline,
		numberOfLines,
		editable = true,
		errorMessage,
		limit,
		...props
	}) => {
	const inputRef = useRef<TextInput>(null)
	const [isFocused, setIsFocused] = useState(false)
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const { colors } = useTheme()
	
	// @ts-expect-error inputRef current value
	const usedValue = editable ? inputRef.current?.value : value
	
	useEffect(() => {
		if (editable && value) {
			// @ts-expect-error inputRef current value
			inputRef.current.value = value
		}
	}, [value, editable])
	
	useEffect(() => {
		console.log('FloatingLabelInput rendered')
	}, [isFocused, isPasswordVisible])
	
	return (
		<>
			<View
				style={[
					styles.inputContainer,
					{
						borderColor: isFocused ? colors.primary : '#ccc',
						marginBottom: errorMessage ? 5 : 10,
					},
				]}
			>
				<Text
					style={[
						styles.label,
						{
							top: isFocused || usedValue ? 0 : 18,
							color: isFocused ? colors.primary : '#aaa',
						},
					]}
				>
					{label}
				</Text>
				<View style={styles.inputWrapper}>
					<TextInput
						{...props}
						ref={inputRef}
						value={usedValue}
						onChangeText={(text) => {
							onChangeText(text)
							// @ts-expect-error inputRef current value
							inputRef.current.value = text
						}}
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
						defaultValue={value}
					/>
					{props.rightIcon && (
						<TouchableOpacity style={styles.icon}>
							{props.rightIcon}
						</TouchableOpacity>
					)}
					{secureTextEntry && (
						<TouchableOpacity
							style={styles.icon}
							onPress={() =>
								setIsPasswordVisible(!isPasswordVisible)
							}
						>
							<Icon
								name={isPasswordVisible ? 'eye-off' : 'eye'}
								size={24}
								color={colors.primary}
							/>
						</TouchableOpacity>
					)}
				</View>
				{limit && (
					<Text
						style={{
							textAlign: 'right',
							fontSize: 12,
							marginBottom: 10,
							color:
								(usedValue || 0) > limit
									? 'red'
									: isFocused
										? colors.primary
										: '#aaa',
						}}
					>
						{usedValue?.length || 0}/{limit}
					</Text>
				)}
			</View>
			{errorMessage && (
				<Text style={styles.errorText}>{errorMessage.toString()}</Text>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	inputContainer: {
		width: '100%',
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		padding: 7,
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
		justifyContent: 'center',
	},
	input: {
		flex: 1,
		fontSize: 15,
		paddingVertical: 7,
		textAlignVertical: 'center',
	},
	icon: {
		padding: 5,
	},
	errorText: {
		color: 'red',
		fontSize: 12,
		marginBottom: 10,
	},
})

export default FloatingLabelInput
