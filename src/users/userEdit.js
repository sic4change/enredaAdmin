import * as React from "react";
import {
    TextInput,
    SimpleForm,
    ReferenceInput,
    SelectInput,
    required,
    ImageInput,
    ImageField,
    FormDataConsumer,
    EditController,
    EditView,
    BooleanInput,
    ReferenceArrayInput,
    SelectArrayInput
}
    from 'react-admin';
import './userStyles.scss';
import {connect} from 'react-redux';
import { DateInput } from 'react-admin-date-inputs';
import {useForm} from 'react-final-form';
import moment from "moment";
import { SaveButton, Toolbar } from 'react-admin';

const maxPerPage = 999999999999999999999999999999999;

const ProvinceInput = ({formData, ...rest}) => {
    const form = useForm();
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('address.city', null);
                                 rest.input.onChange(value);
                             },
                         }}
                         choices={rest.choices.filter((data) => data.countryId === formData.address.country)}
    />);
};

const CountryInput = ({formData, ...rest}) => {
    const form = useForm();
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('address.province', null);
                                 form.change('address.city', null);
                                 rest.input.onChange(value);
                             },
                         }}
    />);
};


const EditTitle = ({record}) => {
    return <span>Editar usuario: {record ? `${record.firstName}` : ''}</span>;
};

const ageValidation = (value) => {

    const today = moment();
    const selectedDate = moment(value);
    const years = today.diff(selectedDate, 'years');

    if (years < 16) {
        return 'La edad debe ser de al menos 16 años';
    }

    return [];
};

const validateAge = [ageValidation];

const UserEditToolbar = props => (
    <Toolbar {...props} >
        <SaveButton />
    </Toolbar>
);

const UserEditView = ({permissions, ...props}) => {

    const newProps = {...props};
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.onChangeInterest;
    delete newProps.onChangeSpecifictInterest;
    delete newProps.formInput;

    return (<EditController {...newProps}>
            {controllerProps =>
                <EditView {...newProps} {...controllerProps} title={<EditTitle/>}>
                    <SimpleForm className={'userGridLayoutCreateEdit'} redirect="show" toolbar={<UserEditToolbar />}>
                        <TextInput source="firstName" label="Nombre" validate={[required()]}/>
                        <TextInput source="lastName" label="Apellidos" />
                        {/* <TextInput source="email" type="email" validate={[required()]}/> */}
                        <TextInput source="address.postCode" label="Código Postal"/>
                        {controllerProps.record && controllerProps.record.address && controllerProps.record.address.country &&
                        <ReferenceInput source="address.country"
                                        label="País"
                                        reference="countries"
                                        sort={{ field: 'name', order: 'ASC' }}
                                        filter={{active: true}}
                                        perPage={maxPerPage} 
                                        validate={[required()]}
                                        onChange={props.onChangeCountry}
                        >
                            <FormDataConsumer>
                                {formDataProps => (
                                    <CountryInput {...formDataProps} />
                                )}
                            </FormDataConsumer>
                        </ReferenceInput>
                        }

                        {controllerProps.record && controllerProps.record.address && controllerProps.record.address.province &&
                        <ReferenceInput source={"address.province"}
                                        label="Provincia"
                                        onChange={props.onChangeProvince}
                                        reference="provinces"
                                        sort={{ field: 'name', order: 'ASC' }}
                                        filter={{active: true}}
                                        perPage={maxPerPage} 
                                        validate={[required()]}
                        >
                            <FormDataConsumer>
                                {formDataProps => (
                                    <ProvinceInput {...formDataProps} />
                                )}
                            </FormDataConsumer>
                        </ReferenceInput>
                        }

                        {controllerProps.record && controllerProps.record.address && controllerProps.record.address.city &&
                        <ReferenceInput source="address.city"
                                        label="Municipio"
                                        reference="cities"
                                        sort={{ field: 'name', order: 'ASC' }}
                                        filter={{active: true}}
                                        perPage={maxPerPage} 
                                        validate={[required()]}
                        >
                            <FormDataConsumer>
                                {({formData, ...rest}) => {
                                    const filteredChoices = rest.choices.filter((data) => data.provinceId === formData.address.province);
                                    return (<SelectInput {...rest}
                                                         choices={filteredChoices}
                                    />)
                                }
                                }
                            </FormDataConsumer>
                        </ReferenceInput>
                        }

                        <DateInput source="birthday" options={{ format: 'dd/MM/yyyy' }} label="Fecha de nacimiento" validate={validateAge}/>
                        <TextInput source="phone" type="number" label="Teléfono"/>
                        {/* <TextInput source="website" label="Sitio web"/> */}
                        {controllerProps.record && controllerProps.record.role && controllerProps.record.role === 'Organización' && permissions && permissions['super-admin'] &&
                        <ReferenceInput source="organization" label="Organización" reference="organizations" perPage={maxPerPage}  sort={{ field: 'name', order: 'ASC' }}>
                            <SelectInput optionText="name"/>
                        </ReferenceInput>
                        }
                        {controllerProps.record && controllerProps.record.education && controllerProps.record.education.value &&
                            <TextInput source="education.value" label="Nivel de educación"/>
                        }

                        {controllerProps.record && controllerProps.record.education && controllerProps.record.education.value &&
                            <ReferenceArrayInput source="motivation.abilities" label="Habilidades a mejorar" reference="abilities" perPage={maxPerPage} sort={{ field: 'name', order: 'ASC' }}>
                                <SelectArrayInput optionText="name"/>
                             </ReferenceArrayInput>
                        }

                        {controllerProps.record && controllerProps.record.education && controllerProps.record.education.value &&
                            <ReferenceArrayInput source="interests.interests" label="Intereses laborales" reference="interests"  onChange={props.onChangeInterest} perPage={maxPerPage} sort={{ field: 'name', order: 'ASC' }}>
                                <SelectArrayInput optionText="name"/>
                             </ReferenceArrayInput>
                        }

                        {controllerProps.record && controllerProps.record.education && controllerProps.record.education.value &&
                            <ReferenceArrayInput source="interests.specificInterests" label="Intereses específicos" reference="specificInterests" onChange={props.onChangeSpecifictInterest} perPage={maxPerPage} sort={{ field: 'name', order: 'ASC' }}>
                                <FormDataConsumer>
                                {({formData, ...rest}) => {
                                    let filteredChoices = []
                                    try {
                                        filteredChoices = rest.choices.filter((data) => formData.interests.interests.indexOf(data.interestId.toString()) >= 0);
                                    } catch(e) {
                                        filteredChoices = []
                                    }
                                    return (<SelectArrayInput {...rest}
                                        choices={filteredChoices}
                                    />)
                                }
                                }
                            </FormDataConsumer>
                                
                             </ReferenceArrayInput>
                        }
                        {controllerProps.record && controllerProps.record.role && controllerProps.record.role === 'Mentor' &&
                            <BooleanInput source="trust" label="De confianza" initialValue='true'/>
                        }
                        <BooleanInput source="active" label="Activo" initialValue='true'/>
                        <ImageInput source="profilePic" label="Foto de perfil" accept="image/*">
                            <ImageField source="src" title="title"/>
                        </ImageInput>
                    </SimpleForm>
                </EditView>
            }
        </EditController>
    )
};

function mapStateToProps(state) {
    return {formInput: state.formInput}
}

function mapDispatchToProps(dispatch) {
    return {
        onChangeCountry: (event) => dispatch({type: 'COUNTRY_SELECTED', value: event.target.value}),
        onChangeProvince: (event) => dispatch({type: 'PROVINCE_SELECTED', value: event.target.value}),
        onChangeInterest: (event) => dispatch({type: 'INTEREST_SELECTED', value: event.target.value}),
        onChangeSpecifictInterest: (event) => dispatch({type: 'SPECIFICT_INTEREST_SELECTED', value: event.target.value})
    };
}

const UserEdit = connect(mapStateToProps, mapDispatchToProps)(UserEditView);
export default UserEdit;
