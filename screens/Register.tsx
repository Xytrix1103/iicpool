import React, { ReactElement, useEffect, useState } from 'react'
import { useForm, UseFormResetField, UseFormTrigger } from 'react-hook-form'
import { Alert, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { register } from '../api/auth'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import RegisterStep1 from './RegisterComponents/RegisterStep1'
import RegisterStep2 from './RegisterComponents/RegisterStep2'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import CustomSolidButton from '../components/themed/CustomSolidButton'

const handleNext = (step: number, setStep: (step: number) => void, trigger: UseFormTrigger<RegisterProps>, steps: StepProps[]) => {
	console.log('Next')
	if (step !== steps.length) {
		if (step === 1) {
			trigger('email').then(r => {
				if (r) {
					setStep(step + 1)
				}
			})
		}
	}
}

const handleBack = (step: number, setStep: (step: number) => void, resetField: UseFormResetField<RegisterProps>) => {
	if (step > 1) {
		setStep(step - 1)
		// reset({
		// 	password: '',
		// 	password_confirmation: '',
		// })
		resetField('password')
		resetField('password_confirmation')
	}
}

export type RegisterProps = {
	email: string;
	password: string;
	password_confirmation: string;
}

type StepProps = {
	header: string;
	component: ReactElement;
}

const Register = () => {
	const form = useForm<RegisterProps>({
		defaultValues: {
			email: '',
			password: '',
			password_confirmation: '',
		},
	})
	
	const {
		handleSubmit,
		reset,
		trigger,
		resetField,
	} = form
	
	const navigation = useNavigation()
	
	const [step, setStep] = useState(1)
	
	// Reset form state when navigating to the page
	useEffect(() => {
		return navigation.addListener('focus', () => {
			reset()
		})
	}, [navigation, reset])
	
	useEffect(() => {
		console.log(step)
	}, [step])
	
	const steps: StepProps[] = [
		{
			header: 'Get Started',
			component: <RegisterStep1 form={form} style={style} />,
		},
		{
			header: 'Create Password',
			component: <RegisterStep2 form={form} style={style} />,
		},
	]
	
	return (
		<CustomLayout
			header={
				<CustomHeader
					title={steps?.[step - 1]?.header}
					onPress={() =>
						step === 1 ? Alert.alert(
							'Cancel Registration',
							'Are you sure you want to cancel the registration?',
							[
								{
									text: 'No',
									style: 'cancel',
								},
								{
									text: 'Yes',
									onPress: () => {
										navigation.goBack()
									},
								},
							],
						) : handleBack(step, setStep, resetField)
					}
				/>
			}
			footer={
				<View style={[style.row, { gap: 10 }]}>
					{
						step > 1 && (
							<CustomOutlinedButton
								onPress={() => handleBack(step, setStep, resetField)}
							>
								Back
							</CustomOutlinedButton>
						)
					}
					{
						step === steps?.length ?
							<CustomSolidButton
								onPress={handleSubmit(register)}
							>
								Register
							</CustomSolidButton> :
							<CustomSolidButton
								onPress={() => handleNext(step, setStep, trigger, steps)}
							>
								Next
							</CustomSolidButton>
					}
				</View>
			}
		>
			<View style={style.mainContent}>
				{steps?.[step - 1]?.component}
			</View>
		</CustomLayout>
	)
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	map: {
		width: '100%',
		height: '100%',
		alignSelf: 'center',
	},
	row: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
	},
	column: {
		flexDirection: 'column',
		width: '100%',
	},
	mainContent: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default Register

