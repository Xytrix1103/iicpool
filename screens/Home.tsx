import React, { useContext, useState } from 'react'
import { View } from 'react-native'
import { Menu } from 'react-native-paper'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { ModeContext } from '../components/contexts/ModeContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import { Role } from '../database/schema'
import { AuthContext } from '../components/contexts/AuthContext'
import style from '../styles/shared'
import CustomTextButton from '../components/themed/CustomTextButton'
import { logout } from '../api/auth'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const Home = () => {
	const navigation = useNavigation()
	const { mode, setMode } = useContext(ModeContext)
	const { profile } = useContext(AuthContext)
	const [visible, setVisible] = useState(false)
	
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
			contentPadding={0}
			header={
				<CustomHeader
					isHome={true}
					title="Home"
					rightNode={
						profile?.roles.includes(Role.DRIVER) &&
						<Menu
							visible={visible}
							onDismiss={() => {
								setVisible(false)
							}}
							anchorPosition="bottom"
							style={{ marginTop: 40 }} // Add margin to avoid overlap
							anchor={
								<CustomIconButton
									icon={mode === 'driver' ? 'steering' : 'seat-passenger'}
									onPress={() => {
										setVisible(true)
									}}
								/>
							}
						>
							<Menu.Item
								leadingIcon="seat-passenger"
								title="Passenger Mode"
								onPress={() => {
									setMode(Role.PASSENGER)
									setVisible(false)
								}}
							/>
							<Menu.Item
								leadingIcon="steering"
								title="Driver Mode"
								onPress={() => {
									setMode(Role.DRIVER)
									setVisible(false)
								}}
							/>
						</Menu>
					}
				/>
			}
		>
			<View style={style.column}>
				<View style={[style.row, {
					backgroundColor: '#f5f269',
					paddingHorizontal: 20,
					paddingVertical: 10,
					justifyContent: 'space-between',
					alignItems: 'center',
				}]}>
					<View style={[style.row, { gap: 10, width: 'auto', alignItems: 'center' }]}>
						<Icon name="alert-circle" size={24} color="darkred" />
						<CustomText size={12}>Your email has not been verified</CustomText>
					</View>
					{/* @ts-expect-error navigation type */}
					<CustomTextButton onPress={() => navigation.navigate('VerifyEmail')} size={12}>
						Verify Now
					</CustomTextButton>
				</View>
				<CustomLayout>
					<View style={style.column}>
						<View style={style.row}>
							<CustomText size={16}>Welcome to the Home Page</CustomText>
						</View>
						<View style={style.row}>
							<CustomTextButton onPress={
								// @ts-expect-error navigation type
								() => navigation.navigate('AddRide')
							}>
								Add Ride
							</CustomTextButton>
						</View>
						<View style={style.row}>
							<CustomTextButton onPress={logout}>Logout</CustomTextButton>
						</View>
					</View>
				</CustomLayout>
			</View>
		</CustomLayout>
	)
}

export default Home
