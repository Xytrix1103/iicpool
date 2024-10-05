import React, { useContext, useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { Menu, useTheme } from 'react-native-paper'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { ModeContext } from '../components/contexts/ModeContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import { Profile, Ride, Role } from '../database/schema'
import { AuthContext } from '../components/contexts/AuthContext'
import style from '../styles/shared'
import CustomTextButton from '../components/themed/CustomTextButton'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import DriverHome from './HomeComponents/DriverHome'
import PassengerHome from './HomeComponents/PassengerHome'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { CAMPUS_NAME } from '../api/location'

const { db } = FirebaseApp

const UnverifiedEmailAlert = ({ navigation }: { navigation: any }) => {
	return (
		<View style={[style.row, {
			gap: 10,
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: '#f5f269',
			paddingHorizontal: 20,
			paddingVertical: 15,
		}]}>
			<View style={[style.row, { gap: 5, alignItems: 'center', width: 'auto' }]}>
				<Icon name="alert-circle" size={16} color="darkred" />
				<CustomText size={12}>Verify your email in Profile to unlock features</CustomText>
			</View>
			<View style={[style.row, { gap: 5, alignItems: 'center', width: 'auto' }]}>
				<CustomTextButton
					onPress={() => navigation.navigate('Profile')}
					size={12}
				>
					Go
				</CustomTextButton>
			</View>
		</View>
	)
}

const ModeSwitchMenu = ({ visible: parentVisible, setMode, mode, profile }: {
	visible: boolean,
	setMode: (mode: Role) => void,
	mode: Role,
	profile: Profile | null,
}) => {
	const [visible, setVisible] = useState(false)
	
	return (
		profile?.roles.includes(Role.DRIVER) &&
		<Menu
			visible={visible && parentVisible}
			onDismiss={() => {
				setVisible(false)
			}}
			anchorPosition="bottom"
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
				trailingIcon={
					mode === Role.PASSENGER ?
						'check' :
						undefined
				}
				title="Passenger Mode "
				onPress={() => {
					setMode(Role.PASSENGER)
					setVisible(false)
				}}
			/>
			<Menu.Item
				leadingIcon="steering"
				title="Driver Mode "
				trailingIcon={
					mode === Role.DRIVER ?
						'check' :
						undefined
				}
				onPress={() => {
					setMode(Role.DRIVER)
					setVisible(false)
				}}
			/>
		</Menu>
	)
}

const Home = () => {
	const { user } = useContext(AuthContext)
	const navigation = useNavigation()
	const { mode, setMode, isInRide } = useContext(ModeContext)
	const { profile } = useContext(AuthContext)
	const { colors } = useTheme()
	const [currentRide, setCurrentRide] = useState<Ride | null>(null)
	
	const roleContent = [
		{
			role: Role.DRIVER,
			icon: 'steering',
			component: <DriverHome navigation={navigation} />,
		},
		{
			role: Role.PASSENGER,
			icon: 'seat-passenger',
			component: <PassengerHome navigation={navigation} />,
		},
	]
	
	useEffect(() => {
		let unsubscribe: any
		
		if (user && isInRide) {
			unsubscribe = onSnapshot(doc(db, 'rides', isInRide), (snapshot) => {
				if (snapshot.exists()) {
					setCurrentRide(snapshot.data() as Ride)
				} else {
					setCurrentRide(null)
				}
			})
		} else {
			setCurrentRide(null)
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [isInRide, user])
	
	return (
		<CustomLayout
			hasAppBar={true}
			contentPadding={0}
			header={
				<CustomHeader
					isHome={true}
					title="Home"
					rightNode={
						<View style={[style.row, { gap: 10, width: 'auto' }]}>
							<ModeSwitchMenu
								visible={!isInRide}
								setMode={setMode}
								mode={mode}
								profile={profile}
							/>
							<CustomIconButton
								icon="cog"
								onPress={() => {
									// @ts-ignore
									navigation.navigate('Settings')
								}}
							/>
						</View>
					}
				/>
			}
		>
			<View style={[style.mainContent]}>
				{
					!user?.emailVerified &&
					<UnverifiedEmailAlert navigation={navigation} />
				}
				<CustomLayout scrollable={true}>
					<View style={[style.mainContent]}>
						<View style={[style.column, { gap: 20, height: '100%' }]}>
							<View style={[style.column, { gap: 10 }]}>
								<View style={[style.row, { gap: 10, alignItems: 'center' }]}>
									<Image
										source={
											require('../assets/logo.png')
										}
										style={{ width: 40, height: '100%' }}
										resizeMode="contain"
									/>
									<CustomText size={20} color="secondary">
										Welcome,{' '}
										<CustomText
											size={20}
											style={{ fontFamily: 'Poppins_Bold' }}
											color={colors.primary}
											bold
										>
											{profile?.full_name}
										</CustomText>
									</CustomText>
								</View>
								<View style={[style.row]}>
									<CustomText size={14}>
										You are currently in{' '}
										<CustomText
											size={14}
											color={colors.primary}
											bold
										>
											{mode}
										</CustomText>
										{' mode'}
									</CustomText>
								</View>
							</View>
							{
								currentRide ?
									<View
										style={[
											style.row,
											{
												backgroundColor: 'white',
												elevation: 5,
												padding: 20,
												borderRadius: 10,
												gap: 10,
											},
										]}
									>
										<View style={[style.column, { gap: 20, flex: 1 }]}>
											<CustomText size={16} bold>
												{currentRide.datetime.toDate().toLocaleString('en-GB', {
													day: 'numeric',
													month: 'numeric',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
													hour12: true,
												})}
											</CustomText>
											<View style={[style.row, { gap: 5 }]}>
												<View style={[style.column, {
													flexDirection: currentRide.to_campus ? 'column' : 'column-reverse',
												}]}>
													<View style={[style.row, { gap: 5 }]}>
														<View style={[style.column, { gap: 5, flex: 1 }]}>
															<Icon name="map-marker" size={30} />
														</View>
														<View style={[style.column, { gap: 5, flex: 6 }]}>
															<CustomText size={14} bold>
																{currentRide.location?.name}
															</CustomText>
														</View>
													</View>
													<View style={[style.row, { gap: 5 }]}>
														<View style={[style.column, { gap: 5, flex: 1 }]}>
															<Icon name="dots-vertical" size={30} />
														</View>
													</View>
													<View style={[style.row, { gap: 5 }]}>
														<View style={[style.column, { gap: 5, flex: 1 }]}>
															<Icon name="school" size={30} />
														</View>
														<View style={[style.column, { gap: 5, flex: 6 }]}>
															<CustomText size={14} bold>
																{CAMPUS_NAME}
															</CustomText>
														</View>
													</View>
												</View>
											</View>
										</View>
									</View> :
									<></>
							}
							{roleContent.find(content => content.role === mode)?.component}
						</View>
					</View>
				</CustomLayout>
			</View>
		</CustomLayout>
	)
}

export default Home
