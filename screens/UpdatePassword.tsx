import { StyleSheet, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import { useForm } from 'react-hook-form'
import { AuthContext } from '../components/contexts/AuthContext'
import React, { useContext, useEffect } from 'react'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'

// @ts-ignore
const UpdatePassword = ({ route }) => {
	const type = route.params?.type
	const { user } = useContext(AuthContext)
	const navigation = useNavigation()
	
	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	})
	
	const { setValue } = form
	
	useEffect(() => {
		console.log(user)
		
		if (user) {
			setValue('email', user.email ?? '')
		}
	}, [user, setValue])
	
	return (
		<CustomLayout
			scrollable={false}
			header={
				<CustomHeader title={type === 'update' ? 'Update Password' : 'Link Email Sign-In'} />
			}
			hasAppBar={false}
			footer={
				<View style={[style.row, { gap: 20 }]}>
					<CustomOutlinedButton onPress={() => navigation.goBack()}>
						Cancel
					</CustomOutlinedButton>
					<CustomSolidButton onPress={() => null}>
						Confirm
					</CustomSolidButton>
				</View>
			}
		>
			<View>
				{/* Add your code here */}
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

export default UpdatePassword
