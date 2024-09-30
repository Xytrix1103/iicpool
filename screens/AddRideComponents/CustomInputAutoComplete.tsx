import { RefObject } from 'react'
import {
	GooglePlaceDetail,
	GooglePlacesAutocomplete,
	GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete'
import { RideFormTypeSingle } from './types'
import { GMAPS_API_KEY } from '../../api/location'
import CustomInput from '../../components/themed/CustomInput'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { StyleSheet, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const CustomInputAutoComplete = (
	{
		autocompleteRef,
		details,
		toCampus,
		handleLocationSelect,
		colors,
	}: {
		autocompleteRef: RefObject<GooglePlacesAutocompleteRef>,
		details: RideFormTypeSingle,
		toCampus: boolean,
		handleLocationSelect: (details: GooglePlaceDetail | null) => void,
		colors: MD3Colors
	},
) => {
	return (
		<View style={{ width: '100%', height: '100%' }}>
			<GooglePlacesAutocomplete
				ref={autocompleteRef}
				placeholder=""
				listViewDisplayed={true}
				onPress={(_data, details = null) => {
					console.log('onPress autocomplete', details)
					handleLocationSelect(details)
				}}
				query={{
					key: GMAPS_API_KEY,
					language: 'en',
					components: 'country:my',
				}}
				enableHighAccuracyLocation={true}
				fetchDetails={true}
				textInputProps={{
					InputComp: CustomInput,
					hideLabelOnFocus: true,
					label: (toCampus ? 'Pick-Up Location' : 'Drop-Off Location'),
					editable: true,
					value: details.name,
					rightIcon: (
						(details.place_id !== '') &&
						<Icon
							onPress={() => {
								handleLocationSelect(null)
							}}
							name="close"
							size={20}
							// @ts-expect-error colors
							color={colors.text}
						/>
					),
				}}
				styles={{
					container: style.autoCompleteContainer,
					textInput: [
						style.textInput,
						{ borderColor: colors.primary },
					],
					listView: style.listView,
					predefinedPlacesDescription: {
						color: colors.primary,
					},
				}}
			/>
		</View>
	)
}

const style = StyleSheet.create({
	autoCompleteContainer: {
		width: '100%',
		height: '100%',
	},
	textInput: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderRadius: 5,
		padding: 10,
		marginVertical: 10,
		fontSize: 16,
		height: '100%',
	},
	listView: {
		backgroundColor: '#fff',
		borderRadius: 5,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: 2 },
	},
})

export default CustomInputAutoComplete
