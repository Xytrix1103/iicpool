import React, { useContext, useState } from 'react'
import { View } from 'react-native'
import { Menu, useTheme } from 'react-native-paper'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { ModeContext } from '../components/contexts/ModeContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import { Profile, Role } from '../database/schema'
import { AuthContext } from '../components/contexts/AuthContext'
import style from '../styles/shared'
import CustomTextButton from '../components/themed/CustomTextButton'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import DriverHome from './HomeComponents/DriverHome'
import PassengerHome from './HomeComponents/PassengerHome'

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

const ModeSwitchMenu = ({ visible, setVisible, setMode, mode, profile }: {
	visible: boolean,
	setVisible: (visible: boolean) => void,
	setMode: (mode: Role) => void,
	mode: Role,
	profile: Profile | null,
}) => {
	return (
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
	)
}

const Home = () => {
	const { user } = useContext(AuthContext)
	const navigation = useNavigation()
	const { mode, setMode } = useContext(ModeContext)
	const { profile } = useContext(AuthContext)
	const [visible, setVisible] = useState(false)
	const { colors } = useTheme()
	
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
								visible={visible}
								setVisible={setVisible}
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
				<CustomLayout>
					<View style={[style.mainContent]}>
						<View style={[style.column, { gap: 10, height: '100%' }]}>
							<View style={style.row}>
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
							{roleContent.find(content => content.role === mode)?.component}
						</View>
					</View>
				</CustomLayout>
			</View>
		</CustomLayout>
	)
}

export default Home
