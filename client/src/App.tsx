import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './components/redux/Store'
import { setSearch, setUser } from './components/redux/AppAction'
import { useQuery } from '@apollo/client'
import AuthGQL from './components/graphql/auth/Auth'
import './styles/App.css'
import Nav from './components/Navbar'
import Home from './components/Home'
import Reg from './components/auth/Register'
import Log from './components/auth/Login'
// import FP from './components/auth/ForgotPassword'
import Col from './components/Collection'
import APIKey from './components/APIKey'
import API from './components/API'
import NF from './components/error/NotFound'

const App: React.FC = () => {
    const appState = useSelector((state: RootState) => state.APP)
    const dispatch = useDispatch()
    const { loading, error, data } = useQuery(AuthGQL)
    const searchHandler = (s: string) => dispatch(setSearch(s))
    const authNav = ['/register', '/login'].includes(window.location.pathname)
    React.useEffect(() => {
        if (!loading) {
            if (data) {
                const { user_id, photo, name, uname, email } = data.auth
                dispatch(setUser({ user_id, photo, name, uname, email }))
            }
            else if (error) dispatch(setUser(null))
        }
    }, [data, error])
    return (
        <BrowserRouter>
            <header className="fixed w-screen">
                {!authNav && <Nav isUser={appState.user} onSearch={searchHandler} />}
                {authNav && <a href="/" className="absolute top-4 left-4 text-[1.2rem] text-white no-underline">&#8592; Back to home</a>}
            </header>
            <main>
                <Routes>
                    <Route path='' element={<Home isUser={appState.user} search={appState.search} />} />
                    <Route path='s' element={<Home isUser={appState.user} search={appState.search} />} />
                    <Route path='collection' element={appState.loadUser ? null : appState.user ? <Col isUser={appState.user} search={appState.search} /> : <Navigate to='/login' />} />
                    <Route path='collection?' element={appState.loadUser ? null : appState.user ? <Col isUser={appState.user} search={appState.search} /> : <Navigate to='/login' />} />
                    <Route path='API' element={appState.loadUser ? null : appState.user ? <APIKey isUser={appState.user} /> : <Navigate to='/login' />} />
                    <Route path="API/:hash" element={<API />} />
                    <Route path='register' element={!appState.user ? <Reg /> : <Navigate to='/' />} />
                    <Route path='login' element={!appState.user ? <Log /> : <Navigate to='/' />} />
                    {/* <Route path='fp' element={!appState.user ? <FP /> : <Navigate to='/' />} /> */}
                    <Route path='*' element={<NF />} />
                </Routes>
            </main>
        </BrowserRouter>
    )
}
export default App