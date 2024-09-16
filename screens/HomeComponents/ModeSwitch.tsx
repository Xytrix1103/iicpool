import React, { useEffect, useRef, useState } from 'react'
import {
	Animated,
	LayoutAnimation,
	Platform,
	StyleSheet,
	TouchableWithoutFeedback,
	UIManager,
	View,
} from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const hexToRgb = (hex: string) => {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b
	})
	
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : null
}

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true)
	}
}

type ModeSwitchProps = {
	buttonWidth?: number,
	buttonPadding?: number,
	buttonColor?: string,
	buttonBorderWidth?: number,
	buttonBorderColor?: string,
	switchWidth?: number,
	switchBackgroundColor?: string,
	switchBorderWidth?: number,
	switchBorderColor?: string,
	leftIcon: string,
	rightIcon: string,
	onSwitch?: () => void,
	onSwitchReverse?: () => void,
	onSwitchBackgroundColor?: string,
	animationSpeed?: number,
	startOnLeft?: boolean,
	disabled?: boolean,
}

const ModeSwitch = (
	{
		buttonWidth = 20,
		buttonPadding,
		buttonColor = '#FFFFFF',
		buttonBorderWidth,
		buttonBorderColor,
		switchWidth = 50,
		switchBackgroundColor = '#D4EDE1',
		switchBorderWidth,
		switchBorderColor,
		leftIcon,
		rightIcon,
		onSwitch,
		onSwitchReverse,
		onSwitchBackgroundColor,
		animationSpeed = 150,
		startOnLeft = false,
		disabled = false,
	}: ModeSwitchProps,
) => {
	const [toggleRight, setToggleRight] = useState(startOnLeft === true)
	
	const colorAnim = useRef(new Animated.Value(0)).current
	const colorAnimInterpolation = onSwitchBackgroundColor && useRef(colorAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [
			// @ts-ignore
			switchBackgroundColor ? hexToRgb(switchBackgroundColor) : hexToRgb('#BBD8B3'),
			// @ts-ignore
			hexToRgb(onSwitchBackgroundColor),
		],
	})).current
	
	const layoutAnim = {
		Opacity: () => (
			LayoutAnimation.configureNext(
				LayoutAnimation.create(
					animationSpeed,
					LayoutAnimation.Types.spring,
					LayoutAnimation.Properties.opacity,
				),
			)
		),
	}
	
	const changeToggle = () => {
		setToggleRight(!toggleRight)
	}
	
	const changeColor = () => {
		if (toggleRight) {
			Animated.timing(
				colorAnim,
				{
					toValue: 1,
					duration: animationSpeed,
					useNativeDriver: false,
				}).start()
		} else {
			Animated.timing(
				colorAnim,
				{
					toValue: 0,
					duration: animationSpeed,
					useNativeDriver: false,
				}).start()
		}
	}
	
	useEffect(() => {
		if (toggleRight && onSwitch) {
			onSwitch()
		} else if (!toggleRight && onSwitchReverse) {
			onSwitchReverse()
		}
		if (onSwitchBackgroundColor) {
			changeColor()
		}
	}, [toggleRight])
	
	const buttonStyle = {
		height: buttonWidth,
		width: buttonWidth,
		backgroundColor: buttonColor,
		borderWidth: buttonBorderWidth ? buttonBorderWidth : 0,
		borderColor: buttonBorderColor ? buttonBorderColor : null,
		borderRadius: buttonWidth / 2,
	}
	
	const toggleStyle = {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: switchWidth,
		backgroundColor: onSwitchBackgroundColor ? colorAnimInterpolation : switchBackgroundColor,
		borderWidth: switchBorderWidth ? switchBorderWidth : 0,
		borderColor: switchBorderColor ? switchBorderColor : null,
		padding: buttonPadding ? buttonPadding : 0,
		borderRadius: switchWidth / 2,
	}
	
	return (
		<TouchableWithoutFeedback onPress={
			!disabled ?
				() => {
					changeToggle()
					layoutAnim.Opacity()
				} :
				() => null
		}>
			{/* @ts-ignore */}
			<Animated.View style={toggleStyle}>
				{!toggleRight &&
					// @ts-ignore
					<Icon name={leftIcon} size={buttonWidth} color={buttonColor} />
				}
				{/* @ts-ignore */}
				<View style={[styles.button, buttonStyle]} />
				{toggleRight &&
					// @ts-ignore
					<Icon name={rightIcon} size={buttonWidth} color={buttonColor} />
				}
			</Animated.View>
		</TouchableWithoutFeedback>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default ModeSwitch
