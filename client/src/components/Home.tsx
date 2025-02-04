import React, { useEffect } from 'react'
import { useQuery, useMutation, ApolloError } from '@apollo/client'
import { FETCH, ADD } from './graphql/book/Home'
import axios, { AxiosResponse } from 'axios'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './redux/Store'
import { setOnline, setLoad, Books, setBooks, setCurrentPage, setTotalPages, setStatus } from './redux/HomeAction'
import Load from './Load'
import Net from './error/Internet'
import NB from './error/NoBooks'

interface Props {
    search: string,
    isUser: {
        user_id: number
    } | null
}
interface URLParams {
    title?: string
    isbn?: string
    page?: string
}
const Home: React.FC<Props> = ({ isUser, search }) => {
    const { refetch } = useQuery(FETCH, { skip: true })
    const [add] = useMutation(ADD)
    const dispatch = useDispatch()
    const homeState = useSelector((state: RootState) => state.HOME)
    const { title, isbn, page }: URLParams = Object.fromEntries(new URLSearchParams(window.location.search))
    const str = title || isbn
    const pg = Number(page) || 1
    const getValidIsbn = (isbn: string[] | string) => {
        if (Array.isArray(isbn)) return isbn.find(isbn => isbn.length === 13) || isbn[0]
        return isbn
    }
    const getValidAuthor = (author: string[] | string) => {
        if (Array.isArray(author)) return author.join(', ')
        return author || 'Unknown'
    }
    const fetchStatus = async (isbnParam: string) => {
        try {
            const res = await refetch({
                user_id: isUser!.user_id,
                isbn: isbnParam
            })
            dispatch(setStatus(res.data.fetch))
        } catch (err) {
            if (err instanceof ApolloError) alert('Fetch Error: ' + err.message)
            else alert('Fetch Error: An unexpected error occurred.')
        }
    }
    const addToCollection = async (cover_i: string, isbn: string, title: string, author_name: string) => {
        if (!isUser) location.href = '/login'
        else if (isUser) {
            try {
                const { data } = await add({
                    variables: {
                        user_id: isUser.user_id,
                        cover_i,
                        isbn,
                        title,
                        author_name
                    }
                })
                if (data.add) fetchStatus(isbn)
            } catch (err) {
                if (err instanceof ApolloError) alert(err.message)
                else alert('An unexpected error occurred.')
            }
        }
    }
    const pageNumbers = () => {
        const pages = []
        const addPages = (s: number, e: number) => {
            for (let i = s; i <= e; i++) pages.push(i)
        }
        const { currentPage, totalPages } = homeState
        if (totalPages <= 9) addPages(1, totalPages)
        else if (search || pg <= 6) {
            addPages(1, 7)
            pages.push('...', totalPages)
        } else if (pg <= totalPages - 4) {
            pages.push(1, '...')
            addPages(pg - 3, pg + 1)
            pages.push('...', totalPages)
        } else if (pg <= totalPages - 3) {
            pages.push(1, '...')
            addPages(pg - 3, pg + 1)
            pages.push(totalPages - 1, totalPages)
        } else if (pg <= totalPages - 2) {
            pages.push(1, '...')
            addPages(pg - 4, pg + 1)
            pages.push(totalPages)
        } else if (pg <= totalPages - 1) {
            pages.push(1, '...')
            addPages(pg - 5, pg + 1)
        } else {
            pages.push(1, '...')
            addPages(pg - 6, pg)
        }
        const handleClick = (page: number) => {
            if (typeof page === 'number') dispatch(setCurrentPage(page))
        }
        return (
            <>
                {pages.map((page, idx) => (
                    <span
                        key={idx}
                        onClick={() => handleClick(page)}
                        className={`cursor-pointer px-3 py-1 rounded-full ${page === (search ? 1 : pg) ? 'bg-blue-500 text-white' : ''}`}
                    >
                        <a href={`s?${/^\d{10}(\d{3})?$/.test(search ?? '') ? 'isbn' : 'title'}=${search ? search.split(' ').join('+') : 'harry+potter'}&page=${currentPage}`}>
                            {page}
                        </a>
                    </span>
                ))}
            </>
        )
    }
    useEffect(() => {
        const handleOnline = () => dispatch(setOnline(navigator.onLine))
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOnline);
        (async () => {
            const fetchBooks = async () => {
                const type = /^\d{10}(\d{3})?$/.test(search) ? 'isbn' : 'title'
                const query = search.split(' ').join('+')
                const res = await axios.get(`https://openlibrary.org/search.json?${type}=${query}&page=${homeState.currentPage}`)
                booksData(res)
                dispatch(setLoad(false))
            }
            const booksData = (res: AxiosResponse) => {
                const { numFound, docs } = res.data
                if (numFound === 0) dispatch(setBooks([]))
                else {
                    dispatch(setBooks(docs))
                    dispatch(setTotalPages(Math.ceil(numFound / 100)))
                }
            }
            if (homeState.online) {
                dispatch(setLoad(true))
                if (search) {
                    dispatch(setCurrentPage(1))
                    fetchBooks()
                } else {
                    const type = /^\d{10}(\d{3})?$/.test(str ?? '') ? 'isbn' : 'title'
                    const query = str ? str.split(' ').join('+') : 'harry+potter'
                    const res = await axios.get(`https://openlibrary.org/search.json?${type}=${query}&page=${pg}`)
                    booksData(res)
                    dispatch(setLoad(false))
                }
            }
        })()
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOnline)
        }
    }, [homeState.online, search])
    useEffect(() => {
        if (isUser && isUser.user_id) {
            homeState.books.forEach((book: Books) => {
                if (book.isbn) fetchStatus(getValidIsbn(book.isbn))
            })
        }
    }, [homeState.books])
    return (
        <>
            {homeState.load ? (
                <Load />
            ) : (
                <>
                    {homeState.online ? (
                        <>
                            {homeState.books.length === 0 ? (
                                <NB />
                            ) : (
                                <>
                                    <div className="mt-16 grid grid-cols-3">
                                        {homeState.books.map((book: Books, idx: number) => (
                                            <div key={idx} className="flex w-[600px] h-[320px] m-[20px] p-[10px] shadow-[0_0_20px_#000]">
                                                <img src={`http://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`}
                                                    alt={book.title}
                                                    className="w-[210px] h-[300px] border-solid border-2 border-[#808080]" />
                                                <div className="ml-4">
                                                    <h1 className="text-center font-black text-xl mb-5">{book.title}</h1>
                                                    <h2 className="text-sm mb-2">Author(s): {Array.isArray(book.author_name) ? book.author_name.join(', ') : book.author_name || 'Unknown'}</h2>
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={book.isbn ? homeState.status[getValidIsbn(book.isbn)] || false : false}
                                                            onChange={() => { if (book.isbn) addToCollection(book.cover_i, getValidIsbn(book.isbn), book.title, getValidAuthor(book.author_name)) }}
                                                            disabled={!book.isbn}
                                                        />
                                                        <span>Add to Collection</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-center">
                                        {pageNumbers()}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <Net />
                    )}
                </>
            )}
        </>
    )
}
export default Home