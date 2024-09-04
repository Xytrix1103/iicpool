import React, { useContext, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import { Button, useTheme } from 'react-native-paper'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { PermissionContext } from '../components/contexts/PermissionContext'
import CustomBackBtnHeader from '../components/themed/CustomBackBtnHeader'
import { useNavigation } from '@react-navigation/native'
import AddRideStep1 from './AddRideComponents/AddRideStep1'
import { useForm } from 'react-hook-form'
import { RideFormType } from './AddRideComponents/types'

const AddRide = () => {
	const [toCampus, setToCampus] = useState(true)
	const navigation = useNavigation()
	const { colors } = useTheme()
	const { loadingOverlay, setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { wrapPermissions } = useContext(PermissionContext)
	const [step, setStep] = useState(1)
	
	const form = useForm<RideFormType>({
		defaultValues: {
			campus: {
				place_id: '',
				formatted_address: '',
				geometry: {
					location: {
						lat: 0,
						lng: 0,
					},
				},
			},
			not_campus: {
				place_id: '',
				formatted_address: '',
				geometry: {
					location: {
						lat: 0,
						lng: 0,
					},
				},
			},
		},
	})
	
	return (
		<CustomLayout
			scrollable={false}
			header={
				<CustomBackBtnHeader
					title="Add Ride"
					navigation={navigation}
				/>
			}
			footer={
				<View style={style.row}>
					{step > 1 && (
						<Button
							mode="contained"
							onPress={() => setStep(step - 1)}
							style={{ flex: 1 }}
						>
							Back
						</Button>
					)}
					<Button
						mode="contained"
						onPress={() => setStep(step + 1)}
						style={{ flex: 1 }}
					>
						{step > 1 ? 'Next' : 'Start'}
					</Button>
				</View>
			}
		>
			<View style={style.mainContent}>
				{step === 1 && (
					<AddRideStep1
						form={form}
						style={style}
						toCampus={toCampus}
						setToCampus={setToCampus}
						setLoadingOverlay={setLoadingOverlay}
						wrapPermissions={wrapPermissions}
						colors={colors}
					/>
				)}
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

export default AddRide
