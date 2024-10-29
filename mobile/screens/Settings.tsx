import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { View } from 'react-native'
import style from '../styles/shared'
import CustomText from '../components/themed/CustomText'
import { Switch } from 'react-native-paper'
import { useNotificationSettings } from '../components/contexts/NotificationContext'
import { ProfileNotificationSettings } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import { logout } from '../api/auth'
import CustomIconButton from '../components/themed/CustomIconButton'

const Settings = () => {
	const { notificationSettings, setNotificationSettings } = useNotificationSettings()
	const navigation = useNavigation()
	
	const handleToggleAllNotifications = async () => {
		const isOldTrue = Object.values(notificationSettings).some((value) => value)
		
		setNotificationSettings(Object.keys(notificationSettings).reduce((acc: ProfileNotificationSettings, key: string) => {
			acc[key as keyof ProfileNotificationSettings] = !isOldTrue
			return acc
		}, {} as ProfileNotificationSettings))
	}
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader
					title="Settings"
					navigation={navigation}
					rightNode={
						<CustomIconButton
							icon="logout"
							onPress={logout}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 40 }]}>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<View style={[style.row, { justifyContent: 'space-between' }]}>
								<CustomText bold>Notifications</CustomText>
								<Switch
									value={Object.values(notificationSettings).some((value) => value)}
									onValueChange={handleToggleAllNotifications}
								/>
							</View>
							<View style={[style.column, { gap: 5 }]}>
								{
									Object.entries(notificationSettings).map(([key, value]) => (
										<View key={key} style={[style.row, { justifyContent: 'space-between' }]}>
											<CustomText
												size={14}>{key.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</CustomText>
											<Switch
												value={value}
												onValueChange={() => {
													setNotificationSettings((prevSettings) => ({
														...prevSettings,
														[key as keyof ProfileNotificationSettings]: !value,
													}))
												}}
											/>
										</View>
									))
								}
							</View>
						</View>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Settings
