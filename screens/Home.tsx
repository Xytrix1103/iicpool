import React, { useContext, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Button, Menu } from 'react-native-paper'
import { logout } from '../api/auth'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomFlex from '../components/themed/CustomFlex'
import CustomHeader from '../components/themed/CustomHeader'
import { ModeContext } from '../components/contexts/ModeContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import { Role } from '../database/schema'

const Home = () => {
	const navigation = useNavigation()
	const { mode, setMode } = useContext(ModeContext)
	const [visible, setVisible] = useState(false)
	
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
			header={
				<CustomHeader
					isHome={true}
					title="Home"
					rightNode={
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
			<CustomFlex>
				<CustomText>Home</CustomText>
				<Button onPress={() => {
					// @ts-ignore
					navigation.navigate('AddRide')
				}}>Ride to Campus</Button>
				<Button onPress={logout}>Logout</Button>
			</CustomFlex>
		</CustomLayout>
	)
}

const style = StyleSheet.create({
	appbar: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
		justifyContent: 'space-evenly',
	},
	button: {
		flexDirection: 'column',
		gap: 5,
		alignItems: 'center',
	},
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

export default Home
